(async()=>{try{const r=await fetch('/.netlify/functions/data');if(r.status===401){location.href='/login.html'}}catch(e){console.error(e)}})();
let state={data:null,charts:{},page:1};
const $=id=>document.getElementById(id);
const rupiah=n=>'Rp '+new Intl.NumberFormat('id-ID',{maximumFractionDigits:0}).format(Number(n||0));
const pct=n=>new Intl.NumberFormat('id-ID',{maximumFractionDigits:1}).format(Number(n||0))+'%';
const monthNames=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

async function api(url,opts={}){
 const r=await fetch('/.netlify/functions/'+url,opts);
 if(r.status===401){location.href='/login.html';throw new Error('Sesi berakhir');}
 const d=await r.json(); if(!r.ok)throw new Error(d.message||'Terjadi kesalahan'); return d;
}
function showToast(s){const t=$('toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function destroy(name){if(state.charts[name]){state.charts[name].destroy();delete state.charts[name]}}
function monthsFor(period){if(period.startsWith('quarter:')){const q=+period.split(':')[1];return [q*3-2,q*3-1,q*3]}return [+period.split(':')[1]]}
function targetForAo(row,targets){
 const os=Number(row.Outstanding||0);return targets.find(t=>os>=Number(t.MinOutstanding||0)&&os<=Number(t.MaxOutstanding||Infinity))||targets.find(t=>String(t.Kategori||'').toLowerCase()==='senior'&&os>=3000000000);
}
function calcAchievement(metric,real,target){
 if(!target||target===0)return null;
 if(metric==='NPF')return (target/Math.max(real,0.000001))*100;
 return (real/target)*100;
}
function byYearRows(rows,year){return rows.filter(r=>Number(r.Tahun)===Number(year))}
function aggregate(rows,months,field,mode='sum'){
 const a=rows.filter(r=>months.includes(Number(r.Bulan))).map(r=>Number(r[field]||0));
 if(!a.length)return 0;
 if(mode==='last')return a[a.length-1];
 if(mode==='avg')return a.reduce((x,y)=>x+y,0)/a.length;
 return a.reduce((x,y)=>x+y,0);
}

async function load(){
 try{
  state.data=await api('data');
  $('adminName').textContent=state.data.user?.nama||'Admin';
  fillPeople();renderDashboard();bindGlobal();
 }catch(e){showToast(e.message)}
}
function fillPeople(){
 const ao=state.data.employees.filter(x=>String(x.Jabatan).toUpperCase()==='AO');
 const fo=state.data.employees.filter(x=>String(x.Jabatan).toUpperCase()==='FO');
 ['dashCompareA','dashCompareB'].forEach(id=>{$(id).innerHTML=ao.map(x=>`<option value="${x.ID}">${x.Nama}</option>`).join('')});
 $('miniAo').innerHTML=ao.map(x=>`<option value="${x.ID}">${x.Nama}</option>`).join('');
 $('miniFo').innerHTML=fo.map(x=>`<option value="${x.ID}">${x.Nama}</option>`).join('');
}
function bindGlobal(){
 $('globalPeriod').addEventListener('change',renderDashboard);
 $('dashCompareType').addEventListener('change',()=>fillComparePeople());
 $('dashCompareA').addEventListener('change',renderDashCompare);$('dashCompareB').addEventListener('change',renderDashCompare);
 $('matrixType').addEventListener('change',renderMarketingTable);$('matrixSearch').addEventListener('input',renderMarketingTable);
 $('miniAo').addEventListener('change',renderMiniCharts);$('miniFo').addEventListener('change',renderMiniCharts);
 $('logoutBtn').addEventListener('click',async()=>{await fetch('/.netlify/functions/logout',{method:'POST'});location.href='/login.html'});
}
function fillComparePeople(){
 const type=$('dashCompareType').value;const list=state.data.employees.filter(x=>String(x.Jabatan).toUpperCase()===type);
 $('dashCompareA').innerHTML=list.map(x=>`<option value="${x.ID}">${x.Nama}</option>`).join('');
 $('dashCompareB').innerHTML=list.map(x=>`<option value="${x.ID}">${x.Nama}</option>`).join('');
 renderDashCompare();
}
function renderDashboard(){
 const p=$('globalPeriod').value,months=monthsFor(p);
 const ao=state.data.employees.filter(x=>String(x.Jabatan).toUpperCase()==='AO'),fo=state.data.employees.filter(x=>String(x.Jabatan).toUpperCase()==='FO');
 $('cardAo').innerHTML=`${ao.length} <em>orang</em>`;$('cardFo').innerHTML=`${fo.length} <em>orang</em>`;
 const aoRows=state.data.kpiAo.filter(x=>months.includes(Number(x.Bulan))),foRows=state.data.kpiFo.filter(x=>months.includes(Number(x.Bulan)));
 $('cardOsAo').textContent=rupiah(ao.reduce((s,e)=>{const rr=aoRows.filter(r=>String(r.ID||r.IDAO)===String(e.ID));return s+(rr.length?Number(rr[rr.length-1].Outstanding||0):0)},0));
 $('cardOsFo').textContent=rupiah(fo.reduce((s,e)=>{const rr=foRows.filter(r=>String(r.ID||r.IDFO)===String(e.ID));return s+(rr.length?Number(rr[rr.length-1].Outstanding||0):0)},0));
 renderBonusCharts(months);renderDashCompare();renderMarketingTable();renderTargetsMini();renderMiniCharts();
}
function renderBonusCharts(months){
 const labels=months.map(m=>monthNames[m-1]);
 const ao=months.map(m=>state.data.kpiAo.filter(r=>Number(r.Bulan)===m).reduce((s,r)=>s+Number(r.TotalBonus||r.Bonus||0),0));
 const fo=months.map(m=>state.data.kpiFo.filter(r=>Number(r.Bulan)===m).reduce((s,r)=>s+Number(r.TotalBonus||r.Bonus||0),0));
 destroy('bonusAo');destroy('bonusFo');
 state.charts.bonusAo=new Chart($('bonusAoChart'),{type:'bar',data:{labels,datasets:[{label:'Realisasi',data:ao,borderRadius:5,backgroundColor:'#2f83e6'},{type:'line',label:'Trend',data:ao,borderColor:'#166dcc',pointRadius:3}]},options:chartOptions(true)});
 state.charts.bonusFo=new Chart($('bonusFoChart'),{type:'bar',data:{labels,datasets:[{label:'Realisasi',data:fo,borderRadius:5,backgroundColor:'#8665dc'},{type:'line',label:'Trend',data:fo,borderColor:'#6948bf',pointRadius:3}]},options:chartOptions(true)});
}
function chartOptions(currency=false){return {responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:9}}},tooltip:{callbacks:{label:c=>currency?rupiah(c.raw):c.raw}}},scales:{x:{grid:{display:false},ticks:{font:{size:8}}},y:{beginAtZero:true,ticks:{font:{size:8},callback:v=>currency?rupiah(v):v}}}}}
function formatMetricValue(metric, value) {
  const name = String(metric || "").toLowerCase();
  const n = Number(value);

  if (!Number.isFinite(n)) return "-";

  // Indikator berbentuk rupiah
  if (/pencairan|outstanding|net.?growth|bonus|uang.?jalan|saldo|fresh.?fund/i.test(name)) {
    return rupiah(n);
  }

  // Indikator berbentuk persentase
  if (/npf|collection.?rate|dokumen.?lengkap|persen|%/i.test(name)) {
    const percent = Math.abs(n) <= 1 ? n * 100 : n;
    return `${percent.toLocaleString("id-ID", {
      maximumFractionDigits: 2
    })}%`;
  }

  // Indikator berbentuk jumlah orang atau kunjungan
  if (/anggota.?baru|visit|kunjungan/i.test(name)) {
    return `${n.toLocaleString("id-ID", {
      maximumFractionDigits: 2
    })} orang/kali`;
  }

  return n.toLocaleString("id-ID", {
    maximumFractionDigits: 2
  });
}

function renderDashCompare(){
 const type=$('dashCompareType').value;const a=$('dashCompareA').value,b=$('dashCompareB').value;
 const rows=type==='AO'?state.data.kpiAo:state.data.kpiFo;
 const metrics=type==='AO'?['Pencairan','Anggota Baru','Net Growth','NPF','Collection','Dokumen','Visit','Outstanding','TotalBonus']:['Outstanding','RataRataSaldoWadiah','RataRataSaldoSimpananBasil','Visit','Anggota Baru','FreshFundTabungan','FreshFundSimpananBasil','TotalBonus'];
 const labels=type==='AO'?['Pencairan','Anggota Baru','Net Growth','NPF','Collection','Dokumen','Visit','Outstanding','Bonus']:['Outstanding','Avg Wadiah','Avg Basil','Visit','Anggota Baru','Fresh Fund Tab','Fresh Fund Basil','Bonus'];
 const vals=id=>metrics.map(m=>{const rr=rows.filter(r=>String(r.ID||r.IDAO||r.IDFO)===String(id));return rr.length?rr.reduce((s,r)=>s+Number(r[m]||0),0)/rr.length:0});
 destroy('dashCompare');

const dashOptions = chartOptions(false);

dashOptions.plugins.tooltip.callbacks.label = c => {
  const metric = labels[c.dataIndex] || 'Indikator';
  return `${c.dataset.label}: ${formatMetricValue(metric, c.raw)}`;
};

state.charts.dashCompare = new Chart($('dashCompareChart'), {
  type: 'bar',
  data: {
    labels,
    datasets: [
      {
        label: state.data.employees.find(
          x => String(x.ID) === String(a)
        )?.Nama || 'A',
        data: vals(a),
        backgroundColor: '#2381e3'
      },
      {
        label: state.data.employees.find(
          x => String(x.ID) === String(b)
        )?.Nama || 'B',
        data: vals(b),
        backgroundColor: '#8665dc'
      }
    ]
  },
  options: dashOptions
});
}
function renderMarketingTable(){
 const type=$('matrixType').value, q=($('matrixSearch').value||'').toLowerCase();
 let list=state.data.employees.filter(x=>(type==='ALL'||String(x.Jabatan).toUpperCase()===type)&&String(x.Nama||'').toLowerCase().includes(q));
 const rows=list.map((e,i)=>{const kr=String(e.Jabatan).toUpperCase()==='AO'?state.data.kpiAo:state.data.kpiFo;const rr=kr.filter(r=>String(r.ID||r.IDAO||r.IDFO)===String(e.ID)).sort((a,b)=>Number(a.Bulan)-Number(b.Bulan));const last=rr[rr.length-1]||{};const t=String(e.Jabatan).toUpperCase()==='AO'?targetForAo(last,state.data.targetAo):null;const target=t?.TargetPencairan||0;const real=Number(last.Pencairan||0);const cap=target?real/target*100:null;return `<tr><td>${i+1}</td><td><strong>${e.Nama||''}</strong></td><td>${e.Jabatan||''}</td><td>${e.Cabang||''}</td><td>${e.MasaKerja||'-'}</td><td>${e.Kategori||t?.Kategori||'FO'}</td><td>${last.Outstanding?rupiah(last.Outstanding):'-'}</td><td>${target?rupiah(target):'-'}</td><td>${real?rupiah(real):'-'}</td><td>${cap===null?'-':`<span class="badge ${cap>=100?'':'warn'}">${pct(cap)}</span>`}</td></tr>`});
 $('marketingTable').querySelector('tbody').innerHTML=rows.join('')||'<tr><td colspan="10" class="empty">Data tidak ditemukan</td></tr>';$('tableInfo').textContent=`Menampilkan 1 - ${list.length} dari ${list.length} data`;
}
function renderTargetsMini(){
 $('targetAoMini').querySelector('tbody').innerHTML=state.data.targetAo.map(t=>`<tr><td>${t.Kategori}</td><td>${rupiah(t.MinOutstanding)}</td><td>${Number(t.MaxOutstanding)>=999999999999?'-':rupiah(t.MaxOutstanding)}</td><td>${rupiah(t.TargetPencairan)}</td></tr>`).join('');
 $('targetFoMini').querySelector('tbody').innerHTML=state.data.targetFo.map(t=>`<tr><td>${t.Indikator}</td><td>${Number(t.Target||0)===0?'0 / Tidak Ada':t.Target}</td></tr>`).join('');
}
function renderMiniCharts(){
 const aoid=$('miniAo').value,foid=$('miniFo').value;
 const ao=state.data.kpiAo.filter(r=>String(r.ID||r.IDAO)===String(aoid)).sort((a,b)=>Number(a.Bulan)-Number(b.Bulan));
 const fo=state.data.kpiFo.filter(r=>String(r.ID||r.IDFO)===String(foid)).sort((a,b)=>Number(a.Bulan)-Number(b.Bulan));
 destroy('miniAo');destroy('miniFo');
 state.charts.miniAo=new Chart($('miniAoChart'),{type:'line',data:{labels:monthNames,datasets:[{label:'Realisasi',data:monthNames.map((_,i)=>Number(ao.find(r=>Number(r.Bulan)===i+1)?.NPF||0)),borderColor:'#2f83e6',tension:.3,pointRadius:2},{label:'Target',data:monthNames.map(()=>5),borderColor:'#e45b5b',borderDash:[5,5],pointRadius:0}]},options:chartOptions(false)});
 state.charts.miniFo=new Chart($('miniFoChart'),{type:'line',data:{labels:monthNames,datasets:[{label:'Realisasi',data:monthNames.map((_,i)=>Number(fo.find(r=>Number(r.Bulan)===i+1)?.FreshFundTabungan||0)),borderColor:'#24b978',tension:.3,pointRadius:2},{label:'Target',data:monthNames.map(()=>0),borderColor:'#9aa8b8',borderDash:[5,5],pointRadius:0}]},options:chartOptions(true)});
}
function openView(view){
 document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));const el=$('view-'+view);if(!el)return;el.classList.add('active');
 document.querySelectorAll('.nav-item,.submenu button').forEach(b=>b.classList.remove('active'));const nav=document.querySelector(`[data-view="${view}"]`);if(nav)nav.classList.add('active');
 if(view!=='dashboard')renderGeneric(view,el);
}
function renderGeneric(view,el){
 const isAo=view.startsWith('ao-'),isFo=view.startsWith('fo-');
 if(view==='target-ao'){el.innerHTML=`<h1 class="page-title">Target Account Officer</h1><p class="page-subtitle">Target dibaca langsung dari Google Spreadsheet.</p><div class="big-panel"><div class="table-wrap"><table><thead><tr><th>Kategori</th><th>Min Outstanding</th><th>Max Outstanding</th><th>Target Pencairan</th><th>Anggota Baru</th><th>Net Growth</th><th>NPF</th><th>Collection</th><th>Dokumen</th><th>Visit</th></tr></thead><tbody>${state.data.targetAo.map(t=>`<tr><td>${t.Kategori}</td><td>${rupiah(t.MinOutstanding)}</td><td>${Number(t.MaxOutstanding)>=999999999999?'-':rupiah(t.MaxOutstanding)}</td><td>${rupiah(t.TargetPencairan)}</td><td>${t.AnggotaBaru}</td><td>${rupiah(t.NetGrowth)}</td><td>${t.NPF}%</td><td>${t.Collection}%</td><td>${t.Dokumen}%</td><td>${t.Visit}</td></tr>`).join('')}</tbody></table></div></div>`;return}
 if(view==='target-fo'){el.innerHTML=`<h1 class="page-title">Target Funding Officer</h1><p class="page-subtitle">Target dibaca langsung dari Google Spreadsheet.</p><div class="big-panel"><table><thead><tr><th>Indikator</th><th>Target</th></tr></thead><tbody>${state.data.targetFo.map(t=>`<tr><td>${t.Indikator}</td><td>${t.Target||'0 / Tidak Ada'}</td></tr>`).join('')}</tbody></table></div>`;return}
 const type=isAo?'AO':'FO';const rows=isAo?state.data.kpiAo:state.data.kpiFo;const people=state.data.employees.filter(e=>String(e.Jabatan).toUpperCase()===type);
 if(view.endsWith('trend')){
   const metrics=isAo?['Pencairan','Anggota Baru','Net Growth','NPF','Collection','Dokumen','Visit','Outstanding','TotalBonus','UangJalan']:['Outstanding','RataRataSaldoWadiah','RataRataSaldoSimpananBasil','Visit','Anggota Baru','FreshFundTabungan','FreshFundSimpananBasil','TotalBonus'];
   const labels=isAo?['Pencairan','Anggota Baru','Net Growth','NPF','Collection','Dokumen','Visit','Outstanding','Total Bonus','Uang Jalan']:['Outstanding','Rata-Rata Saldo Wadiah','Rata-Rata Saldo Basil','Visit','Anggota Baru','Fresh Fund Tabungan','Fresh Fund Simpanan Basil','Total Bonus'];
   el.innerHTML=`<h1 class="page-title">Tren Bulanan ${type}</h1><p class="page-subtitle">Bandingkan realisasi dengan target dari Januari sampai Desember.</p><div class="toolbar"><label>Petugas<select id="trendPerson">${people.map(p=>`<option value="${p.ID}">${p.Nama}</option>`).join('')}</select></label><label>Tahun<select id="trendYear"><option>2026</option><option>2027</option><option>2028</option></select></label><label>Indikator<select id="trendMetric">${metrics.map((m,i)=>`<option value="${m}">${labels[i]}</option>`).join('')}</select></label></div><div class="big-panel"><canvas id="genericChart"></canvas></div>`;
   const draw=()=>{const id=$('trendPerson').value,m=$('trendMetric').value;const rr=rows.filter(r=>String(r.ID||r.IDAO||r.IDFO)===String(id));const real=monthNames.map((_,i)=>Number(rr.find(r=>Number(r.Bulan)===i+1)?.[m]||0));let target=monthNames.map(()=>0);if(type==='AO'){if(m==='NPF')target=monthNames.map(()=>5);else if(m==='Pencairan'){const last=rr[rr.length-1]||{};const t=targetForAo(last,state.data.targetAo);target=monthNames.map(()=>Number(t?.TargetPencairan||0))}else{const map={AnggotaBaru:13,NetGrowth:50000000,Collection:100,Dokumen:100,Visit:13};if(map[m]!=null)target=monthNames.map(()=>map[m])}}else if(m==='Visit')target=monthNames.map(()=>100);
   destroy('generic');state.charts.generic=new Chart($('genericChart'),{type:'line',data:{labels:monthNames,datasets:[{label:'Realisasi',data:real,borderColor:type==='AO'?'#2f83e6':'#24b978',tension:.25},{label:'Target',data:target,borderColor:'#ef6a6a',borderDash:[6,4],tension:0}]},options:chartOptions(m.toLowerCase().includes('pencairan')||m.toLowerCase().includes('fund')||m==='Outstanding'||m==='NetGrowth'||m==='UangJalan')})};
   ['trendPerson','trendYear','trendMetric'].forEach(id=>$(id).addEventListener('change',draw));draw();return;
 }
 if(view.endsWith('compare')){
   el.innerHTML=`<h1 class="page-title">Komparasi Sisi ke Sisi ${type}</h1><p class="page-subtitle">Bandingkan dua petugas pada satu indikator KPI.</p><div class="toolbar"><label>Tahun<select id="cmpYear"><option>2026</option><option>2027</option></select></label><label>Indikator<select id="cmpMetric"></select></label><label>Petugas A<select id="cmpA">${people.map(p=>`<option value="${p.ID}">${p.Nama}</option>`).join('')}</select></label><label>Petugas B<select id="cmpB">${people.map(p=>`<option value="${p.ID}">${p.Nama}</option>`).join('')}</select></label></div><div class="big-panel"><canvas id="compareChart"></canvas></div>`;
   const metrics=isAo?['Pencairan','Anggota Baru','Net Growth','NPF','Collection','Dokumen','Visit','Outstanding']:['Outstanding','RataRataSaldoWadiah','RataRataSaldoSimpananBasil','Visit','Anggota Baru','FreshFundTabungan','FreshFundSimpananBasil'];
   $('cmpMetric').innerHTML=metrics.map(m=>`<option value="${m}">${m}</option>`).join('');
   const draw=()=>{const m=$('cmpMetric').value,a=$('cmpA').value,b=$('cmpB').value;const vals=id=>monthNames.map((_,i)=>Number(rows.find(r=>String(r.ID||r.IDAO||r.IDFO)===String(id)&&Number(r.Bulan)===i+1)?.[m]||0));destroy('compare');state.charts.compare=new Chart($('compareChart'),{type:'line',data:{labels:monthNames,datasets:[{label:people.find(p=>String(p.ID)===String(a))?.Nama,data:vals(a),borderColor:'#2f83e6',tension:.25},{label:people.find(p=>String(p.ID)===String(b))?.Nama,data:vals(b),borderColor:'#8665dc',tension:.25}]},options:chartOptions(false)})};
   ['cmpYear','cmpMetric','cmpA','cmpB'].forEach(id=>$(id).addEventListener('change',draw));draw();return;
 }
 // matrices
 const matrixType=type;const metrics=isAo?['Pencairan','Anggota Baru','Net Growth','NPF','Collection','Dokumen','Visit','Outstanding','TotalBonus']:['Outstanding','RataRataSaldoWadiah','RataRataSaldoSimpananBasil','Visit','Anggota Baru','FreshFundTabungan','FreshFundSimpananBasil','TotalBonus'];
 el.innerHTML=`<h1 class="page-title">Matriks ${matrixType}</h1><p class="page-subtitle">Ringkasan otomatis seluruh ${matrixType} dalam format rekening koran KPI.</p><div class="big-panel matrix-scroll"><table class="matrix-table"><thead><tr><th>Nama</th>${metrics.map(m=>`<th>${m}<br>Realisasi / Target / Capaian</th>`).join('')}</tr></thead><tbody>${people.map(p=>{const rr=rows.filter(r=>String(r.ID||r.IDAO||r.IDFO)===String(p.ID));const last=rr[rr.length-1]||{};return `<tr><td><strong>${p.Nama}</strong></td>${metrics.map(m=>{let real=Number(last[m]||0),target=0;if(isAo){const t=targetForAo(last,state.data.targetAo);target=t?.[m]??({AnggotaBaru:13,NetGrowth:50000000,NPF:5,Collection:100,Dokumen:100,Visit:13}[m]||0)}else if(m==='Visit')target=100;const cap=calcAchievement(m,real,target);return `<td>${real?real.toLocaleString('id-ID'):'0'} / ${target?target.toLocaleString('id-ID'):'-' } / ${cap==null?'-':pct(cap)}</td>`}).join('')}</tr>`}).join('')}</tbody></table></div>`;
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>openView(b.dataset.view)));
document.querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.toggle+'-menu').classList.toggle('open')));
load();

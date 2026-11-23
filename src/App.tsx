import { useMemo, useState } from 'react';
import { defaultConfig } from './experiments/at001/config';
import { runAt001 } from './experiments/at001/model';
import { measureAt001 } from './experiments/at001/metrics';

export default function App() {
  const [seed, setSeed] = useState(defaultConfig.seed);
  const [frequency, setFrequency] = useState(0.5);
  const [switches, setSwitches] = useState(defaultConfig.switches);
  const config = useMemo(() => ({ ...defaultConfig, seed, switches }), [seed, switches]);
  const result = useMemo(() => runAt001(config, frequency), [config, frequency]);
  const metrics = useMemo(() => measureAt001(config, frequency), [config, frequency]);
  const max = Math.max(...result.history, 0.001);
  const toggle = (key: keyof typeof switches) =>
    setSwitches(current => ({ ...current, [key]: !current[key] }));

  return <main className="shell">
    <header className="topbar"><div className="mark">Ω</div><div><p className="eyebrow">ATANOR Ω · LABORATORIO COMPUTACIONAL</p><h1>CRIPTOCROMO</h1></div><span className="status">PROTOTIPO 0.1</span></header>
    <section className="intro"><p className="eyebrow">EXPERIMENTO AT-001</p><h2>Memoria resonante<br/><em>autoorganizada</em></h2><p className="lead">¿Puede la combinación de persistencia, resonancia selectiva y adaptación local producir una dinámica distinta de la suma de sus partes?</p></section>
    <section className="workspace">
      <div className="panel controls"><div className="panel-heading"><span className="eyebrow">01 / PARÁMETROS</span><span className="tiny">EJECUCIÓN DETERMINISTA</span></div>
        <label htmlFor="frequency">Frecuencia del estímulo <strong>{frequency.toFixed(2)}</strong></label>
        <input id="frequency" type="range" min="0" max="1" step="0.01" value={frequency} onChange={e => setFrequency(Number(e.target.value))}/>
        <label htmlFor="seed">Semilla experimental</label><input id="seed" type="number" value={seed} onChange={e => setSeed(Number(e.target.value) || 1)}/>
        <div className="switches"><p className="eyebrow">MECANISMOS / ABLACIONES</p>
          <label className="toggle"><input type="checkbox" checked={switches.memory} onChange={() => toggle('memory')}/> Persistencia de memoria</label>
          <label className="toggle"><input type="checkbox" checked={switches.resonance} onChange={() => toggle('resonance')}/> Resonancia selectiva</label>
          <label className="toggle"><input type="checkbox" checked={switches.plasticity} onChange={() => toggle('plasticity')}/> Plasticidad local</label>
        </div>
        <button onClick={() => { setSeed(value => value + 1); }}>Cambiar semilla <span>↗</span></button>
      </div>
      <div className="panel output"><div className="panel-heading"><span className="eyebrow">02 / RESPUESTA DEL SISTEMA</span><span className="tiny">42 PASOS · 24 NODOS</span></div>
        <div className="chart" role="img" aria-label="Evolución de la activación media">
          {result.history.map((value, index) => <div className={index < 18 ? 'bar pulse' : 'bar recovery'} key={index} style={{height:`${Math.max(2,value/max*100)}%`}} title={`Paso ${index+1}: ${value.toFixed(4)}`}/>)}
        </div><div className="chart-legend"><span>ESTÍMULO</span><span>RECUPERACIÓN</span></div>
        <div className="metrics"><div><span>PICO DE ACTIVACIÓN</span><strong>{metrics.peakActivation.toFixed(4)}</strong></div><div><span>ACTIVIDAD RESIDUAL</span><strong>{metrics.residualActivation.toFixed(4)}</strong></div><div><span>ÍNDICE DE PERSISTENCIA</span><strong>{metrics.persistenceRatio.toFixed(3)}</strong></div><div><span>NODOS ACTIVOS</span><strong>{(metrics.activeNodeFraction*100).toFixed(1)}%</strong></div></div>
      </div>
    </section>
    <section className="note"><span className="eyebrow">03 / NOTA METODOLÓGICA</span><p>Esta visualización muestra una simulación computacional definida por parámetros explícitos. No representa un fenómeno físico medido. La persistencia observada depende del modelo, la semilla y la configuración; todavía no constituye evidencia de emergencia ni de novedad.</p></section>
    <footer><span>EXPERIMENT ≠ RESULT ≠ CONCLUSION</span><span>CRIPTOCROMO / ATANOR Ω</span></footer>
  </main>;
}

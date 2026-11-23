import { useMemo, useState } from 'react';
import { defaultConfig } from './experiments/at001/config';
import { runAt001 } from './experiments/at001/model';
import { measureAt001 } from './experiments/at001/metrics';

export default function App() {
  const [seed, setSeed] = useState(defaultConfig.seed);
  const [frequency, setFrequency] = useState(0.5);
  const [runNumber, setRunNumber] = useState(0);
  const config = useMemo(() => ({ ...defaultConfig, seed }), [seed]);
  const result = useMemo(
    () => runAt001(config, frequency),
    [config, frequency, runNumber]
  );
  const metrics = useMemo(
    () => measureAt001(config, frequency),
    [config, frequency, runNumber]
  );
  const max = Math.max(...result.history, 0.001);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="mark">Ω</div>
        <div>
          <p className="eyebrow">ATANOR Ω · LABORATORIO COMPUTACIONAL</p>
          <h1>CRIPTOCROMO</h1>
        </div>
        <span className="status">PROTOTIPO 0.1</span>
      </header>

      <section className="intro">
        <p className="eyebrow">EXPERIMENTO AT-001</p>
        <h2>Memoria resonante<br /><em>autoorganizada</em></h2>
        <p className="lead">¿Puede la combinación de persistencia, resonancia selectiva y adaptación local producir una dinámica distinta de la suma de sus partes?</p>
      </section>

      <section className="workspace">
        <div className="panel controls">
          <div className="panel-heading">
            <span className="eyebrow">01 / PARÁMETROS</span>
            <span className="tiny">EJECUCIÓN DETERMINISTA</span>
          </div>
          <label htmlFor="frequency">Frecuencia del estímulo <strong>{frequency.toFixed(2)}</strong></label>
          <input id="frequency" type="range" min="0" max="1" step="0.01" value={frequency} onChange={event => setFrequency(Number(event.target.value))} />
          <label htmlFor="seed">Semilla experimental</label>
          <input id="seed" type="number" value={seed} onChange={event => setSeed(Number(event.target.value) || 1)} />
          <div className="switches">
            <p className="eyebrow">MECANISMOS ACTIVOS</p>
            <span><i className="dot on" /> Persistencia de memoria</span>
            <span><i className="dot on" /> Resonancia selectiva</span>
            <span><i className="dot on" /> Plasticidad local</span>
          </div>
          <button onClick={() => setRunNumber(value => value + 1)}>Reiniciar experimento <span>↗</span></button>
        </div>

        <div className="panel output">
          <div className="panel-heading">
            <span className="eyebrow">02 / RESPUESTA DEL SISTEMA</span>
            <span className="tiny">42 PASOS · 24 NODOS</span>
          </div>
          <div className="chart" role="img" aria-label="Evolución de la activación media durante el experimento">
            {result.history.map((value, index) => (
              <div className={index < 18 ? 'bar pulse' : 'bar recovery'} key={index} style={{ height: `${Math.max(2, value / max * 100)}%` }} title={`Paso ${index + 1}: ${value.toFixed(4)}`} />
            ))}
          </div>
          <div className="chart-legend"><span>ESTÍMULO</span><span>RECUPERACIÓN</span></div>
          <div className="metrics">
            <div><span>PICO DE ACTIVACIÓN</span><strong>{metrics.peakActivation.toFixed(4)}</strong></div>
            <div><span>ACTIVIDAD RESIDUAL</span><strong>{metrics.residualActivation.toFixed(4)}</strong></div>
            <div><span>ÍNDICE DE PERSISTENCIA</span><strong>{metrics.persistenceRatio.toFixed(3)}</strong></div>
            <div><span>NODOS ACTIVOS</span><strong>{(metrics.activeNodeFraction * 100).toFixed(1)}%</strong></div>
          </div>
        </div>
      </section>

      <section className="note">
        <span className="eyebrow">03 / NOTA METODOLÓGICA</span>
        <p>Esta visualización muestra una simulación computacional definida por parámetros explícitos. No representa un fenómeno físico medido. La persistencia observada depende del modelo, la semilla y la configuración; todavía no constituye evidencia de emergencia ni de novedad.</p>
      </section>

      <footer><span>EXPERIMENT ≠ RESULT ≠ CONCLUSION</span><span>CRIPTOCROMO / ATANOR Ω</span></footer>
    </main>
  );
}

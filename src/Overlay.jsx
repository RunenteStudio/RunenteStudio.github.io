import styles from "./Overlay.module.css";
import { Canvas, useThree } from "@react-three/fiber";

export function Overlay() {
  return (
    <div className={styles.container}>
      <header>
        <h1>
          <a id="main-button"
             href="#"
             onClick={setMainText}>
          <strong>museo/</strong>mainRoom <sup>Demo</sup>
          </a>
        </h1>
        <nav>
          <a
            id="screen-button"
            href="#"
            onClick={setText}
            rel="noreferrer"
            className={styles.selected}
          >
            / pantalla
          </a>
          <a 
             id="sculpt-button"
             href="#"
             onClick={setSculptureText}
             rel="noreferrer">
            / escultura
          </a>
        </nav>
      </header>
      <section id="slr">
        Ejemplo de museo interactivo. <br/> En esta sección aparecerá información del objeto seleccionado en menú
      </section>
      
    </div>
  );
}

function setText (e){
  e.preventDefault();
  //sectionText.textContent = 'Showcase';
  document.getElementById('slr').textContent = 'Showcase';  
}

function setSculptureText (e){
  e.preventDefault();
  //sectionText.textContent = 'Escultura abstracta esférica';
  document.getElementById('slr').textContent = 'Escultura abstracta esférica';
}

function setMainText (e){
  e.preventDefault();
  document.getElementById('slr').innerHTML = 'Ejemplo de museo interactivo. <br/> En esta sección aparecerá información del objeto seleccionado en menú';
}
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
          <strong>MUSEO</strong><sup>Demo</sup>
          </a>
        </h1>
        <nav>

        </nav>
      </header>
      <section id="slr">
        Ejemplo de museo interactivo. <br/> En esta sección aparecerá información del objeto seleccionado al hacer hover
      </section>
      
    </div>
  );
}

export function setText (e){
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

export function setText1 (){
  document.getElementById('slr').textContent = 'Showcase';  
}

export function SetPercentageText(percentage){
  document.getElementById('slr').textContent = percentage;  
}
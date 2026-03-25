# 🏋️ Contador de Sentadillas

Aplicación web que cuenta tus sentadillas en **tiempo real** usando la cámara y detección de pose mediante inteligencia artificial.

---

## ¿Cómo funciona?

Utiliza el modelo **MoveNet Lightning** de TensorFlow.js para detectar los puntos clave del cuerpo directamente en el navegador, sin enviar datos a ningún servidor. Mide el ángulo de la rodilla en cada frame y determina si estás en posición **arriba** o **abajo**, contando una repetición cada vez que completas el movimiento.

```
Cadera → Rodilla → Tobillo   →   ángulo < 100° = abajo
                              →   ángulo > 160° = arriba → +1 rep
```

---

## Características

- Detección de pose 100% en el navegador (sin backend)
- Selección automática del lado con mayor confianza (izquierdo o derecho)
- Visualización del esqueleto sobre la imagen de la cámara
- Muestra el ángulo de rodilla en tiempo real
- Indicador de fase (↑ ARRIBA / ↓ ABAJO)
- Botones para reiniciar el contador y parar la sesión

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| React 18 | Interfaz de usuario |
| Vite | Bundler / dev server |
| TensorFlow.js | Inferencia de modelos en el navegador |
| MoveNet Lightning | Modelo de detección de pose |

---

## Instalación y uso

```bash
# Clonar el repositorio
git clone https://github.com/Asier-Comba/Contador-sentadilas.git
cd Contador-sentadilas

# Instalar dependencias
npm install

# Arrancar en desarrollo
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

> **Consejo:** Colócate de **perfil** ante la cámara para que el modelo detecte mejor el ángulo de la rodilla.

---

## Build para producción

```bash
npm run build
npm run preview
```

---

## Autor

**Asier Comba** — [github.com/Asier-Comba](https://github.com/Asier-Comba)

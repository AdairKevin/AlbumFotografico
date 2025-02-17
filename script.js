const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const btnCapturar = document.querySelector("#capturar");
const btnEnviar = document.querySelector("#enviar");
const apiUrl = "https://apifotos-production.up.railway.app/fotos";
const camaraDiv = document.querySelector(".camara");
const capturadaDiv = document.querySelector(".capturada");
const btnAbrirCamara = document.querySelector("#abrir");
const btnSubir = document.querySelector("#subir");
const btnCambiar = document.querySelector("#cambiarCamara");

let useFrontCamera = false;
let currentStream = null;

async function iniciarCamara() {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }
  const constraints = {
    video: {
      facingMode: useFrontCamera ? "user" : "environment",
    },
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
      // Ajustar el tamaño del canvas si es necesario
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    });

    // Ajustar el modo espejo según la cámara
    video.style.transform = useFrontCamera ? "scaleX(-1)" : "scaleX(1)";
  } catch (error) {
    console.error("Error al acceder a la cámara:", error);
  }
}

btnCambiar.addEventListener("click", () => {
  useFrontCamera = !useFrontCamera;
  iniciarCamara();
});

btnSubir.addEventListener("click", () => {
  capturadaDiv.style.display = "flex";
});

btnAbrirCamara.addEventListener("click", () => {
  camaraDiv.style.display = "block";
  iniciarCamara();
});

btnCapturar.addEventListener("click", () => {
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  capturadaDiv.style.display = "flex";
});

btnEnviar.addEventListener("click", async () => {
  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append("image", blob, "captura.jpg"); // La clave debe ser "image" como espera el backend
    formData.append("name", "Mi foto desde la cámara"); // Puedes enviar un nombre opcional

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok)
        throw new Error(`Error en la petición: ${response.statusText}`);

      const data = await response.json();
      console.log("Respuesta de la API:", data);

      obtenerFotos();
    } catch (error) {
      console.error("Error al enviar la foto:", error);
    }
  }, "image/jpeg");
});

// Función para obtener y mostrar las fotos
async function obtenerFotos() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok)
      throw new Error(`Error en la petición: ${response.statusText}`);

    const fotos = await response.json();
    mostrarFotos(fotos);
  } catch (error) {
    console.error("Error al obtener las fotos:", error);
  }
}

const albumContainer = document.querySelector("#album");
// Función para mostrar las fotos en el álbum
function mostrarFotos(fotos) {
  albumContainer.innerHTML = ""; // Limpiar antes de agregar nuevas fotos

  fotos.forEach((foto) => {
    if (foto.image && foto.image.secure_url) {
      const imgElement = document.createElement("img");
      imgElement.src = foto.image.secure_url;
      imgElement.alt = "Foto subida";
      imgElement.classList.add("foto");

      albumContainer.appendChild(imgElement);
    }
  });
}

// Cargar fotos al cargar la página
document.addEventListener("DOMContentLoaded", obtenerFotos);

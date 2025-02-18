const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const btnCapturar = document.querySelector("#capturar");
const btnEnviar = document.querySelector("#enviar");
const apiUrl = "https://apifotos-production.up.railway.app/fotos";
const capturadaDiv = document.querySelector(".capturada");
const btnSubir = document.querySelector("#subir");
const inputSubirFoto = document.getElementById("inputSubirFoto");

let useFrontCamera = false;
let currentStream = null;

const btnCapturarFoto = document.getElementById("capturarFotoBtn");
const inputCapturarFoto = document.getElementById("capturarFoto");

btnCapturarFoto.addEventListener("click", () => {
  // Simular un clic en el input de archivo para abrir la cámara
  inputCapturarFoto.click();
});

// Manejar la selección de la foto
inputCapturarFoto.addEventListener("change", (event) => {
  const file = event.target.files[0]; // Obtener el archivo seleccionado
  const ctx = canvas.getContext("2d");
  if (file) {
    const reader = new FileReader();

    // Cargar la imagen y dibujarla en el canvas
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        // Ajustar el tamaño del canvas a la imagen
        canvas.width = img.width;
        canvas.height = img.height;

        // Dibujar la imagen en el canvas
        ctx.drawImage(img, 0, 0, img.width, img.height);
        capturadaDiv.style.display = "flex"; // Mostrar la foto capturada
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }
});

btnSubir.addEventListener("click", () => {
  inputSubirFoto.click();
  capturadaDiv.style.display = "flex";
});

inputSubirFoto.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const ctx = canvas.getContext("2d");
  if (file) {
    const reader = new FileReader();

    // Cargar la imagen y dibujarla en el canvas
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        // Ajustar el tamaño del canvas a la imagen
        canvas.width = img.width;
        canvas.height = img.height;

        // Dibujar la imagen en el canvas
        ctx.drawImage(img, 0, 0, img.width, img.height);
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }
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

      alert("Fotografia enviada");

      capturadaDiv.style.display = "none";
    } catch (error) {
      console.error("Error al enviar la foto:", error);
    }
  }, "image/jpeg");
});

let startX = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let currentIndex = 0;
let isDragging = false;
let totalFotos = 0; // Nueva variable para almacenar el total de fotos

const albumContainer = document.querySelector("#album");

async function obtenerFotos() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok)
      throw new Error(`Error en la petición: ${response.statusText}`);

    const fotos = await response.json();
    mostrarFotos(fotos);
    agregarEventosDeslizamiento();
    totalFotos = fotos.length; // Actualizar el total de fotos
    iniciarDeslizamientoAutomatico(); // Iniciar el slider automático
  } catch (error) {
    console.error("Error al obtener las fotos:", error);
  }
}

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

function agregarEventosDeslizamiento() {
  const slider = document.querySelector("#album-slider");

  slider.addEventListener("touchstart", iniciarDeslizamiento);
  slider.addEventListener("touchmove", moverDeslizamiento);
  slider.addEventListener("touchend", finalizarDeslizamiento);
}

function iniciarDeslizamiento(e) {
  isDragging = true;
  startX = e.touches[0].clientX;
  albumContainer.style.transition = "none"; // Desactivar la animación durante el arrastre
}

function moverDeslizamiento(e) {
  if (!isDragging) return;

  const currentX = e.touches[0].clientX;
  const desplazamiento = currentX - startX;
  currentTranslate = prevTranslate + desplazamiento;

  albumContainer.style.transform = `translateX(${currentTranslate}px)`;
}

function finalizarDeslizamiento() {
  isDragging = false;
  const anchoSlider = document.querySelector("#album-slider").offsetWidth;
  const umbralDeslizamiento = anchoSlider * 0.25;

  if (
    currentTranslate - prevTranslate < -umbralDeslizamiento &&
    currentIndex < totalFotos - 1
  ) {
    currentIndex++; // Deslizar a la derecha
  } else if (
    currentTranslate - prevTranslate > umbralDeslizamiento &&
    currentIndex > 0
  ) {
    currentIndex--; // Deslizar a la izquierda
  }

  actualizarPosicion();
}

function actualizarPosicion() {
  const anchoSlider = document.querySelector("#album-slider").offsetWidth;
  currentTranslate = -currentIndex * anchoSlider;
  prevTranslate = currentTranslate;
  albumContainer.style.transition = "transform 0.3s ease-in-out";
  albumContainer.style.transform = `translateX(${currentTranslate}px)`;
}

// Nueva función para deslizamiento automático
function iniciarDeslizamientoAutomatico() {
  setInterval(() => {
    if (currentIndex < totalFotos - 1) {
      currentIndex++;
    } else {
      currentIndex = 0; // Reiniciar al principio cuando llegue al final
    }
    actualizarPosicion();
  }, 3000);
}

const btnDownload = document.querySelector("#download");

btnDownload.addEventListener("click", () => {
  descargarAlbum();
});

async function descargarAlbum() {
  try {
    // Crear una instancia de JSZip
    const zip = new JSZip();

    // Obtener todas las imágenes visibles en albumContainer
    const fotos = albumContainer.querySelectorAll("img");

    for (let [index, img] of fotos.entries()) {
      const imageResponse = await fetch(img.src); // Descargar la imagen
      const imageBlob = await imageResponse.blob(); // Convertir la imagen a blob
      const arrayBuffer = await imageBlob.arrayBuffer(); // Convertir el blob a ArrayBuffer

      // Agregar cada imagen al archivo ZIP con un nombre único
      zip.file(`foto-${index + 1}.jpg`, arrayBuffer);
    }

    // Generar el archivo ZIP
    const zipContent = await zip.generateAsync({ type: "blob" });

    // Crear un enlace para la descarga del ZIP
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipContent);
    link.download = "album-comprimido.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error al descargar el álbum:", error);
  }
}

document.addEventListener("DOMContentLoaded", obtenerFotos);

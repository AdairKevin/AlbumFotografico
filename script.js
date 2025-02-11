const video = document.querySelector("#video");
const canvas = document.querySelector("#canvas");
const btnCapturar = document.querySelector("#capturar");
const btnEnviar = document.querySelector("#enviar");
const apiUrl =
  "https://32bb4af9-9ba0-49cd-82fb-d580d9533ba1-00-15tv2cgqsd4e4.worf.replit.dev/fotos";

// Iniciar la cámara
async function iniciarCamara() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (error) {
    console.error("Error al acceder a la cámara:", error);
  }
}

// Capturar foto y dibujar en el canvas
btnCapturar.addEventListener("click", () => {
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
});

// Enviar la imagen a la API
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
    } catch (error) {
      console.error("Error al enviar la foto:", error);
    }
  }, "image/jpeg");
});

// Iniciar la cámara al cargar la página
iniciarCamara();

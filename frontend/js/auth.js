document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const errorDiv = document.getElementById("errorMessage")

  errorDiv.style.display = "none"

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      window.location.href = "/dashboard.html"
    } else {
      errorDiv.textContent = data.error || "Error al iniciar sesión"
      errorDiv.style.display = "block"
    }
  } catch (error) {
    console.error("Error:", error)
    errorDiv.textContent = "Error de conexión. Por favor, intente nuevamente."
    errorDiv.style.display = "block"
  }
})

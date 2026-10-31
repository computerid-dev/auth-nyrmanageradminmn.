(() => {
  // Link pin resmi. Domain lain akan ditolak.
  const PIN = ["auth-nyrmanageradminmn.vercel.app"];
  const kicked = new URLSearchParams(location.search).has("blocked");

  if (!kicked && PIN.includes(location.hostname)) {
    location.replace("./muchineko-auth-manager/");
    return;
  }
  document.getElementById("msg").textContent = "link tidak resmi! Tidak dapat dibuka!";
})();

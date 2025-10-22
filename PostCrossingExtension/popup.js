// popup.js
document.getElementById("asc").addEventListener("click", async () => {
  setStatus("Sorting ascending...");
  try {
    const resp = await browser.runtime.sendMessage({ cmd: "sort", order: "asc" });
    if (resp && resp.success) setStatus(`Done — processed ${resp.windowsProcessed} window(s).`);
    else setStatus("Done (no matches or error).");
  } catch (err) {
    setStatus("Error: " + (err.message || err));
  }
});

document.getElementById("desc").addEventListener("click", async () => {
  setStatus("Sorting descending...");
  try {
    const resp = await browser.runtime.sendMessage({ cmd: "sort", order: "desc" });
    if (resp && resp.success) setStatus(`Done — processed ${resp.windowsProcessed} window(s).`);
    else setStatus("Done (no matches or error).");
  } catch (err) {
    setStatus("Error: " + (err.message || err));
  }
});

function setStatus(text) {
  document.getElementById("status").textContent = text;
}

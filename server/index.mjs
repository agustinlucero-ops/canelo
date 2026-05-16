import app from "./app.mjs";

const PORT = Number(process.env.API_PORT) || 8787;

app.listen(PORT, () => {
  console.log(`API lista en http://localhost:${PORT}`);
});

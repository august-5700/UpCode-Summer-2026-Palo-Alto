export const fetchGeoDataForPoint = async (lat:number, lon:number) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
  if (!res.ok) {
    throw new Error("Response failed with status " + res.status);
  }
  return res.json()
}
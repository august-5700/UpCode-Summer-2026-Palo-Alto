export const fetchGeoDataForPoint = async (lat:number, lon:number) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
  if (!res.ok) {
    throw new Error("Response failed with status " + res.status);
  }
  return res.json()
}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vpcxcjmotpouxuiwjlpi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwY3hjam1vdHBvdXh1aXdqbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDU3NDYsImV4cCI6MjA5NzcyMTc0Nn0.mz2E2rOTdBAk34OEGF-KSr5NgPDvnceg8Ayv2cSpMqw"
);

export default async function getCounties() {
  const { data, error } = await supabase
    .from("counties")
    .select("*");
  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

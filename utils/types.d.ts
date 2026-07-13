type GeoData = {
    name: string;
    lat: number;
    lng: number;
    county: string;
    bbox: [number, number, number, number];
}

type Point = {
    lat?: number | null;
    lng?: number | null;
    [key: string]: any;
};
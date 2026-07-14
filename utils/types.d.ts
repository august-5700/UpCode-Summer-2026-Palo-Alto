type GeoData = {
    name: string;
    lat: number;
    lng: number;
    county: string;
    bbox: [number, number, number, number];
}

type MarkerType = {
    lat?: number | null;
    lng?: number | null;
    address: string | null;
    highlighted: true | false;
    [key: string]: any;
};
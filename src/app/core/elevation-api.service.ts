import { Injectable } from '@angular/core';

export interface ElevationSample {
  latitude: number;
  longitude: number;
  elevation: number;
  normalized: number;
}

export interface ElevationArea {
  south: number;
  north: number;
  west: number;
  east: number;
}

/**
 * Adaptador demostrativo para la TessaDEM Elevation API.
 * En producción, un backend debe proteger la API key y solicitar mode=area.
 */
@Injectable({ providedIn: 'root' })
export class ElevationApiService {
  readonly provider = 'TessaDEM Elevation API';
  readonly endpoint = 'https://tessadem.com/api/elevation';
  readonly resolutionMeters = 30;
  readonly requestMode = 'area';
  readonly responseFormat = 'GeoTIFF';
  readonly status = 'simulated' as const;

  getSimulatedArea(area: ElevationArea, step = 0.002): ElevationSample[] {
    const samples: ElevationSample[] = [];
    for (let lat = area.south; lat <= area.north; lat += step * 1.1) {
      for (let lng = area.west; lng <= area.east; lng += step) {
        const sample = this.getSimulatedPoint(area, lat, lng);
        if (sample) samples.push(sample);
      }
    }
    return samples;
  }

  getSimulatedPoint(area: ElevationArea, latitude: number, longitude: number): ElevationSample | null {
    if (latitude < area.south || latitude > area.north || longitude < area.west || longitude > area.east) return null;
    const coast = -70.323 + Math.sin((latitude + 18.47) * 52) * 0.0022;
    if (longitude < coast) return null;

    const inlandRise = Math.min(1, Math.max(0, (longitude - coast) * 10.2));
    const northernRidge = Math.exp(-(((latitude + 18.445) / 0.014) ** 2 + ((longitude + 70.276) / 0.018) ** 2));
    const southernHill = Math.exp(-(((latitude + 18.505) / 0.018) ** 2 + ((longitude + 70.286) / 0.020) ** 2));
    const azapaValley = Math.exp(-(((latitude + 18.489) / 0.010) ** 2 + ((longitude + 70.260) / 0.035) ** 2));
    const coastalPlain = Math.exp(-(((latitude + 18.477) / 0.017) ** 2 + ((longitude + 70.314) / 0.009) ** 2));
    const normalized = Math.max(0.035, Math.min(1,
      0.055 + inlandRise * 0.86 + northernRidge * 0.18 + southernHill * 0.13 - azapaValley * 0.17 - coastalPlain * 0.08,
    ));
    return { latitude, longitude, normalized, elevation: Math.round(normalized * 340) };
  }
}

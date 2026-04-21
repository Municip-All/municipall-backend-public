import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5/weather';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENWEATHER_API_KEY') || '';
  }

  async getWeather(lat: number, lon: number) {
    if (!this.apiKey) {
      return {
        error: 'Weather API key not configured',
        status: 500,
      };
    }

    try {
      const url = `${this.baseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=fr`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OpenWeather API returned ${response.status}`);
      }

      const data = await response.json();
      
      return {
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        city: data.name,
      };
    } catch (error) {
      console.error('WeatherService Error:', error);
      return {
        error: 'Failed to fetch weather data',
        status: 500,
      };
    }
  }
}

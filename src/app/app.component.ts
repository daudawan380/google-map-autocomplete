import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';

declare const google: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  @ViewChild('pacInput', { static: true }) pacInputElement!: ElementRef;
  map: any;
  searchBox: any;
  markers: any[] = [];
  selectedPlace: any = {};

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center: { lat: -33.8688, lng: 151.2195 },
      zoom: 13,
      mapTypeId: 'roadmap',
    });

    const input = this.pacInputElement.nativeElement;
    this.searchBox = new google.maps.places.SearchBox(input);
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    this.map.addListener('bounds_changed', () => {
      this.ngZone.run(() => {
        this.searchBox.setBounds(this.map.getBounds());
      });
    });

    this.searchBox.addListener('places_changed', () => {
      this.ngZone.run(() => {
        const places = this.searchBox.getPlaces();

        if (places.length === 0) {
          return;
        }

        this.markers.forEach((marker: any) => {
          marker.setMap(null);
        });
        this.markers = [];

        const bounds = new google.maps.LatLngBounds();

        places.forEach((place: any) => {
          if (!place.geometry || !place.geometry.location) {
            console.log('Returned place contains no geometry');
            return;
          }

          const icon = {
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25),
          };

          this.markers.push(
            new google.maps.Marker({
              map: this.map,
              icon,
              title: place.name,
              position: place.geometry.location,
            })
          );

          if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }

          // Set the selected place details
          this.selectedPlace = {
            address: place.formatted_address || '',
            postalCode: this.getAddressComponent(place, 'postal_code'),
            state: this.getAddressComponent(place, 'administrative_area_level_1'),
            city: this.getAddressComponent(place, 'locality') || this.getAddressComponent(place, 'administrative_area_level_2')
          };
        });

        this.map.fitBounds(bounds);
      });
    });
  }

  getAddressComponent(place: any, componentType: string): string {
    for (const component of place.address_components) {
      for (const type of component.types) {
        if (type === componentType) {
          return component.long_name;
        }
      }
    }
    return '';
  }
}

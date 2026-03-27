'use client'

import {useEffect, useRef, useState} from 'react'
import {Card} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Loader2, MapPin, Navigation} from 'lucide-react'

interface MapLibreMapProps {
    center?: [number, number]
    zoom?: number
    markers?: Array<{
        id: string
        position: [number, number]
        title?: string
        description?: string
    }>
    height?: string
    className?: string
    onMarkerClick?: (marker: any) => void
}

export default function MapLibreMap({
                                        center = [0, 0],
                                        zoom = 10,
                                        markers = [],
                                        height = '400px',
                                        className = '',
                                        onMarkerClick,
                                    }: MapLibreMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!mapRef.current) return

        const initMap = async () => {
            try {
                setLoading(true)
                setError(null)

                // Dynamic import of maplibre-gl
                const maplibregl = await import('maplibre-gl')
                // Use free open-source tiles from multiple providers
                // No API key required!
                const freeTileStyles = {
                    osm: 'https://raw.githubusercontent.com/maplibre/maplibre-gl-js/main/src/style/default-style.json',
                    positron: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
                }

                const map = new maplibregl.Map({
                    container: mapRef.current!,
                    style: freeTileStyles.osm, // Free OSM tiles, no key needed!
                    center,
                    zoom,
                })

                mapInstanceRef.current = map

                // Add markers
                markers.forEach(marker => {
                    const markerElement = document.createElement('div')
                    markerElement.className = 'w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer flex items-center justify-center'
                    markerElement.innerHTML = '<div class="w-2 h-2 bg-white rounded-full"></div>'

                    const mapMarker = new maplibregl.Marker(markerElement)
                        .setLngLat(marker.position)
                        .addTo(map)

                    if (onMarkerClick) {
                        markerElement.addEventListener('click', () => onMarkerClick(marker))
                    }
                })

                setLoading(false)
            } catch (err) {
                console.error('Failed to load map:', err)
                setError('Failed to load map. Please check your internet connection.')
                setLoading(false)
            }
        }

        initMap()

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
            }
        }
    }, [center, zoom, markers, onMarkerClick])

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser')
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const {latitude, longitude} = position.coords
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo({
                        center: [longitude, latitude],
                        zoom: 14,
                    })
                }
            },
            (err) => {
                setError('Unable to get your location. Please check your permissions.')
            }
        )
    }

    return (
        <Card className={`relative overflow-hidden ${className}`} style={{height}}>
            {loading && (
                <div
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex flex-col items-center space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin"/>
                        <span className="text-sm text-muted-foreground">Loading map...</span>
                    </div>
                </div>
            )}

            {error && (
                <div
                    className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center space-y-4 p-4">
                        <div className="text-destructive text-sm">{error}</div>
                        <Button onClick={() => window.location.reload()} size="sm">
                            Retry
                        </Button>
                    </div>
                </div>
            )}

            <div ref={mapRef} className="w-full h-full"/>

            <div className="absolute bottom-4 right-4 z-5">
                <Button
                    size="sm"
                    onClick={handleGetCurrentLocation}
                    className="bg-white/90 hover:bg-white text-foreground shadow-lg"
                >
                    <Navigation className="h-4 w-4"/>
                </Button>
            </div>

            <div className="absolute top-4 left-4 z-5">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                    <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-blue-500"/>
                        <span className="text-muted-foreground">
              {markers.length} users nearby
            </span>
                    </div>
                </div>
            </div>
        </Card>
    )
}
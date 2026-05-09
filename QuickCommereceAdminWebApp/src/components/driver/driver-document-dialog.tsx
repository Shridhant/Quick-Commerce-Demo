"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, Car, FileText, Download, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Driver } from "@/hooks/useDriver"

interface DriverDocumentsDialogProps {
  driver: Driver | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DriverDocumentsDialog({ driver, open, onOpenChange }: DriverDocumentsDialogProps) {
  const [imageLoading, setImageLoading] = useState(false)

  if (!driver) return null

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="size-5" />
            {driver.name} - Documents
          </DialogTitle>
          <DialogDescription>
            View vehicle image and driving license for driver ID: {driver.driver_id}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Tabs defaultValue={driver.vehicle_image ? "vehicle" : "license"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {driver.vehicle_image && (
                <TabsTrigger value="vehicle" className="flex items-center gap-2">
                  <Car className="size-4" />
                  Vehicle Image
                </TabsTrigger>
              )}
              {driver.driving_license_file && (
                <TabsTrigger value="license" className="flex items-center gap-2">
                  <FileText className="size-4" />
                  Driving License
                </TabsTrigger>
              )}
            </TabsList>

            {driver.vehicle_image && (
              <TabsContent value="vehicle" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Car className="size-5" />
                        Vehicle Image
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(driver.vehicle_image!, "vehicle-image.jpg")}
                        >
                          <Download className="size-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openInNewTab(driver.vehicle_image!)}>
                          <ExternalLink className="size-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div
                      className="rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden"
                      style={{ width: "100%", height: "250px" }}
                    >
                      {imageLoading && (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="size-8 animate-spin text-primary" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading image...</span>
                        </div>
                      )}
                      <img
                        src={driver.vehicle_image || "/placeholder.svg"}
                        alt={`Vehicle of ${driver.name}`}
                        className={`w-full h-full object-contain ${imageLoading ? "hidden" : "block"}`}
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                          setImageLoading(false)
                          toast.error("Failed to load vehicle image")
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {driver.driving_license_file && (
              <TabsContent value="license" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="size-5" />
                        Driving License
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(driver.driving_license_file!, "driving-license.pdf")}
                        >
                          <Download className="size-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openInNewTab(driver.driving_license_file!)}>
                          <ExternalLink className="size-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full">
                      <div className="border rounded-lg overflow-hidden" style={{ height: "300px" }}>
                        <iframe
                          src={`${driver.driving_license_file}#toolbar=0&navpanes=0&zoom=page-width`}
                          className="w-full h-full"
                          title={`Driving License - ${driver.name}`}
                          onLoad={() => setImageLoading(false)}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        PDF preview — If the document doesn't display properly, use "Open in New Tab" or "Download PDF"
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {!driver.vehicle_image && !driver.driving_license_file && (
              <div className="text-center py-12">
                <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Documents Available</h3>
                <p className="text-muted-foreground">This driver hasn't uploaded any documents yet.</p>
              </div>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

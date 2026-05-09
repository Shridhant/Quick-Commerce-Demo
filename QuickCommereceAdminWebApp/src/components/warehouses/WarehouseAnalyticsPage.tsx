import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Package, 
  Users, 
  AlertTriangle,
  Building2,
  BarChart3,
  Activity
} from "lucide-react"
import { useWarehouseActivities, useWarehouseAnalytics } from "@/hooks/useWarehouses"

export default function WarehouseAnalyticsPage() {
  interface WarehouseOverview {
    total_warehouses: number;
    active_warehouses: number;
    total_stock_quantity: number;
    total_inventory_items: number;
    unique_products_stored: number;
    total_vendors_served: number;
  }
  
  const { warehouseId } = useParams()
  const navigate = useNavigate()
  
  const { analytics, isLoading: analyticsLoading } = useWarehouseAnalytics(warehouseId)
  const { activities, isLoading: activitiesLoading } = useWarehouseActivities(warehouseId, 10)

  const isLoading = analyticsLoading || activitiesLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const overview = analytics?.overview as WarehouseOverview || {}
  const selectedWarehouse = warehouseId 
    ? analytics?.warehouseBreakdown?.find(w => w.warehouse_id === warehouseId)
    : null
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/warehouses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Warehouses
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {selectedWarehouse ? selectedWarehouse.warehouse_name : 'All Warehouses'} Analytics
            </h1>
            {selectedWarehouse && (
              <p className="text-muted-foreground">
                {selectedWarehouse.city}, {selectedWarehouse.state}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_warehouses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview.active_warehouses || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(overview.total_stock_quantity || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.total_inventory_items || 0} inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Products</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.unique_products_stored || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all warehouses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors Served</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_vendors_served || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active partnerships
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory Overview</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Distribution</TabsTrigger>
          <TabsTrigger value="alerts">Low Stock Alerts</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
        </TabsList>

        {/* Inventory Overview Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Products</TableHead>
                    <TableHead className="text-right">Vendors</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.warehouseBreakdown?.map((warehouse) => (
                    <TableRow key={warehouse.warehouse_id}>
                      <TableCell className="font-medium">{warehouse.warehouse_name}</TableCell>
                      <TableCell>{warehouse.city}, {warehouse.state}</TableCell>
                      <TableCell>
                        <Badge variant={warehouse.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {warehouse.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{warehouse.inventory_items}</TableCell>
                      <TableCell className="text-right">{warehouse.product_count}</TableCell>
                      <TableCell className="text-right">{warehouse.vendor_count}</TableCell>
                      <TableCell className="text-right font-bold">
                        {warehouse.total_quantity.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Inventory Items</TableHead>
                    <TableHead className="text-right">Unique Products</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.categoryDistribution?.map((category, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {category.category || 'Uncategorized'}
                      </TableCell>
                      <TableCell className="text-right">{category.inventory_items}</TableCell>
                      <TableCell className="text-right">{category.unique_products}</TableCell>
                      <TableCell className="text-right font-bold">
                        {category.total_quantity.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    {warehouseId && <TableHead>Warehouse</TableHead>}
                    <TableHead className="text-right">Total Stock</TableHead>
                    <TableHead className="text-right">Vendors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.topProducts?.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.brand}</TableCell>
                      {warehouseId && (
                        <TableCell>{product.warehouse_name}</TableCell>
                      )}
                      <TableCell className="text-right font-bold">
                        {product.total_stock.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{product.vendor_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Distribution Tab */}
        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Inventory Items</TableHead>
                    <TableHead className="text-right">Total Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.vendorDistribution?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.warehouse_name}</TableCell>
                      <TableCell>{item.vendor_name}</TableCell>
                      <TableCell>{item.vendor_city}</TableCell>
                      <TableCell className="text-right">{item.inventory_items}</TableCell>
                      <TableCell className="text-right font-bold">
                        {item.total_stock.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <CardTitle>Low Stock Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.lowStockAlerts?.map((item, idx) => (
                    <TableRow key={idx} className="bg-orange-50/50">
                      <TableCell className="font-medium">{item.warehouse_name}</TableCell>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.vendor_name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive" className="font-bold">
                          {item.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.last_updated).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <CardTitle>Recent Activities</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities?.map((activity) => (
                    <TableRow key={activity.order_id}>
                      <TableCell className="font-mono text-sm">{activity.order_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{activity.type}</Badge>
                      </TableCell>
                      <TableCell>{activity.warehouse_name || 'N/A'}</TableCell>
                      <TableCell>{activity.vendor_name}</TableCell>
                      <TableCell>
                        {activity.driver_name ? (
                          <div className="text-sm">
                            <div>{activity.driver_name}</div>
                            <div className="text-muted-foreground">{activity.driver_phone}</div>
                          </div>
                        ) : (
                          'Not assigned'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            activity.order_status === 'COMPLETED' ? 'default' :
                            activity.order_status === 'PENDING' ? 'secondary' :
                            'outline'
                          }
                        >
                          {activity.order_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {activity.pickup_date ? new Date(activity.pickup_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
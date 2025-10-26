import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { ShoppingBag, User, DollarSign, CreditCard, Phone, MapPin } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
}

interface Order {
  id: string;
  cliente: string;
  telefone: string; 
  endereco: string;
  total: string;
  status: string;
  meio_pagamento: string;
  itens: OrderItem[];
  created_at: string;
}

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await api.request<Order[]>('/pedidos', { requiresAuth: true });
      setOrders(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar pedidos",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.request(`/pedidos/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
        requiresAuth: true,
      });
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      toast({
        title: "Status atualizado!",
        description: "O pedido foi atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: "bg-yellow-500",
      preparando: "bg-blue-500",
      pronto: "bg-green-500",
      entregue: "bg-gray-500",
      cancelado: "bg-red-500",
    };
    return colors[status.toLowerCase()] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-display font-bold mb-8 animate-fade-in">
          Pedidos
        </h1>

        {loading ? (
          <p className="text-center text-muted-foreground">Carregando pedidos...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhum pedido encontrado</p>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-elevated animate-fade-in">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
               <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{order.cliente}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{order.telefone}</span>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{order.endereco}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">R$ {order.total}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{order.meio_pagamento}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Itens:
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {order.itens.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                          <span>R$ {item.price}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium mb-2 block">
                      Atualizar Status:
                    </label>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateStatus(order.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="preparando">Preparando</SelectItem>
                        <SelectItem value="pronto">Pronto</SelectItem>
                        <SelectItem value="entregue">Entregue</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;

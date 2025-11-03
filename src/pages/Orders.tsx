import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { ShoppingBag, User, DollarSign, CreditCard, Phone, MapPin, RefreshCw, AlertTriangle, Loader2, Trash2, StickyNote, Package, Clock, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { echo } from "@/lib/echo";



interface OrderStatusEvent {
    id: string; // Ou number, dependendo do backend
    status: string;
}

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
  tipo_entrega: string;      // <-- NOVO
  observacoes: string | null;
  period: "lunch" | "dinner";
  itens: OrderItem[];
  created_at: string;
}

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);


  const formatOrderTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return timestamp; // Retorna o original se falhar
    }
  };

  useEffect(() => {
    fetchOrders();


  const statusChannel = echo.private('admin-orders'); // Ou o canal que você usa
    
    statusChannel.listen('.OrderStatusUpdated', (event: OrderStatusEvent) => {
      console.log('Orders.tsx ouviu OrderStatusUpdated', event);
      setOrders(currentOrders => 
        currentOrders.map(order => 
          order.id === event.id ? { ...order, status: event.status } : order
        )
      );
    });
    
    // (Opcional) Ouvir por um evento de reset global
    // statusChannel.listen('.PedidosResetados', () => {
    //   console.log('Orders.tsx ouviu PedidosResetados');
    //   setOrders([]); // Limpa a lista local
    //   toast({ title: "Pedidos Resetados", description: "A lista de pedidos foi limpa."});
    // });

    return () => {
      statusChannel.stopListening('.OrderStatusUpdated');
      // statusChannel.stopListening('.PedidosResetados');
      echo.leave('admin-orders'); // Sai do canal
    };

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

  const handleResetOrders = async () => {
    setResetting(true);
    try {
      // Chama a nova rota da API
      await api.request('/pedidos/reset', {
        method: 'POST',
        requiresAuth: true,
      });

      // Limpa a lista local após o sucesso da API
      setOrders([]); 
      
      toast({
        title: "Pedidos Resetados!",
        description: "Todos os pedidos foram removidos com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao resetar",
        description: error instanceof Error ? error.message : "Não foi possível resetar os pedidos.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
    <main className="container mx-auto px-4 py-8">
        {/* MODIFICADO: Adiciona div para alinhar título e botão */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-display font-bold animate-fade-in">
            Pedidos
          </h1>
          {/* --- NOVO: Botão de Reset com AlertDialog --- */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={loading || resetting}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Resetar Pedidos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-destructive"/> Confirmação Necessária
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover **TODOS** os pedidos? Esta ação é 
                  permanente e não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={resetting}>Cancelar</AlertDialogCancel>
                {/* Chama handleResetOrders ao clicar */}
                <AlertDialogAction 
                  onClick={handleResetOrders} 
                  disabled={resetting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {resetting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin"/> 
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2"/>
                  )}
                  {resetting ? "Resetando..." : "Sim, Remover Tudo"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* --- Fim do Botão de Reset --- */}
        </div>

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
                   <div>
                      <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                      {/* --- NOVO: HORA DO PEDIDO --- */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatOrderTime(order.created_at)}</span>
                      </div>
                      {/* --- FIM HORA DO PEDIDO --- */}
                    </div>
                    
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
                    
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-sm capitalize">
                        {order.tipo_entrega}
                      </Badge>
                    </div>
                  <div className="flex items-center gap-2">
                      {order.period === 'lunch' ? (
                        <Sun className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Moon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge variant="outline" className="text-sm capitalize">
                        {order.period === 'lunch' ? 'Almoço' : 'Jantar'}
                      </Badge>
                    </div>
                    {/* --- FIM DO PERÍODO --- */}
                  
                 

                  {/* --- NOVO CAMPO DE OBSERVAÇÕES --- */}
                  {order.observacoes && (
                    <div className="pt-2 border-t">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <StickyNote className="h-4 w-4" />
                        Observações:
                      </h4>
                      <p className="text-sm text-muted-foreground italic">
                        "{order.observacoes}"
                      </p>
                    </div>
                  )}
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
                        <SelectItem value="Saiu para entrega">Saiu para entrega</SelectItem>
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

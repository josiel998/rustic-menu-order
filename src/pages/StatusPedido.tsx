import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UtensilsCrossed, Loader2, AlertCircle } from "lucide-react";
import { echo } from "@/lib/echo";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
}

interface PublicOrder {
  id: number;
  cliente: string;
  status: string;
  total: string;
  itens: OrderItem[];
}

interface OrderStatusEvent {
  id: number;
  status: string;
}

const StatusPedido = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) return;

    const fetchOrderStatus = async () => {
      try {
        setLoading(true);
        const data = await api.request<PublicOrder>(`/pedidos/status/${uuid}`);
        setOrder(data);
      } catch (err) {
        setError("Pedido não encontrado ou ocorreu um erro.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStatus();
    // 2. Se inscrever no canal do WebSocket (ex: 'order.UUID-DO-PEDIDO')
    const channel = echo.channel(`order.${uuid}`);
    
    // 3. Ouvir pelo evento 'OrderStatusUpdated' (o nome da sua classe de Evento)
    channel.listen('OrderStatusUpdated', (event: OrderStatusEvent) => {
      console.log('Evento de status recebido!', event);
 // 4. Atualizar o estado local com o novo status
      setOrder((currentOrder) => {
        // Verificamos se o pedido em tela é o mesmo do evento
        if (currentOrder && currentOrder.id === event.id) {
          // Retorna um novo objeto de estado com o status atualizado
          return { ...currentOrder, status: event.status };
        }
        return currentOrder;
      });
    });

    // 5. Função de limpeza: Quando o usuário sair da página,
    // saímos do canal para não sobrecarregar o servidor.
    return () => {
      channel.stopListening('OrderStatusUpdated');
      echo.leaveChannel(`order.${uuid}`);
    };
    
  }, [uuid]);

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-display">Status do Pedido</CardTitle>
            <Link to="/" title="Ir para o Cardápio">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
            </Link>
          </div>
          {order && (
            <CardDescription>
              Olá, {order.cliente}. Este é o status do seu pedido #{order.id}.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Buscando seu pedido...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {order && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Status Atual:</p>
                <Badge className={`text-lg px-4 py-1 ${getStatusColor(order.status)}`}>
                  {order.status}
                </Badge>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Itens:</h4>
                <ul className="space-y-1 text-sm list-disc pl-5">
                  {order.itens.map((item, index) => (
                    <li key={index}>
                      {item.quantity}x {item.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span className="text-accent">R$ {order.total}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusPedido;
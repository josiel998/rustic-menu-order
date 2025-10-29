import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";


interface MenuItem {
  id: string;
  name: string;
  price: string;
}

interface OrderResponse {
  id: number;
  uuid: string;
  // ... (outros campos se precisar)
}

interface CartItem extends MenuItem {
  
  quantity: number;
}

interface OrderFormProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
}

export function OrderForm({ cart, onUpdateQuantity, onRemoveFromCart, onClearCart }: OrderFormProps) {
  const { toast } = useToast();
  const [telefone, setTelefone] = useState(""); 
  const [endereco, setEndereco] = useState("");
  const [cliente, setCliente] = useState("");
  const [meioPagamento, setMeioPagamento] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedOrderUuid, setSubmittedOrderUuid] = useState<string | null>(null);
  

  // const addToCart = (item: MenuItem) => {
  //   const existing = cart.find(i => i.id === item.id);
  //   if (existing) {
  //     setCart(cart.map(i => 
  //       i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
  //     ));
  //   } else {
  //     setCart([...cart, { ...item, quantity: 1 }]);
  //   }
  // };

  // const updateQuantity = (id: string, delta: number) => {
  //   setCart(cart.map(item => 
  //     item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
  //   ).filter(item => item.quantity > 0));
  // };

  // const removeFromCart = (id: string) => {
  //   setCart(cart.filter(item => item.id !== id));
  // };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao pedido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

   try {
      // Diga ao 'api.request' o que esperamos de volta
      const newOrder = await api.request<OrderResponse>('/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          cliente,
          telefone,
          endereco,
          meio_pagamento: meioPagamento,
          itens: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: getTotal(),
          status: 'pendente',
        }),
      });

      toast({
        title: "Pedido realizado!",
        description: "Seu pedido foi enviado com sucesso.",
      });

    onClearCart();
      
      // Limpa os campos locais
      setCliente("");
      setTelefone("");
      setEndereco("");
      setMeioPagamento("");

      // SALVA O UUID do pedido
      setSubmittedOrderUuid(newOrder.uuid);

    } catch (error) {
      toast({
        title: "Erro ao fazer pedido",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submittedOrderUuid) {
    return (
      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Pedido Enviado com Sucesso!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>Seu pedido foi recebido e está como "Pendente".</p>
          <p>Você pode acompanhar o status do seu pedido através do link abaixo:</p>
          <Button asChild className="w-full">
            <Link to={`/pedido/${submittedOrderUuid}`}>
              Acompanhar Pedido (ID: ...{submittedOrderUuid.slice(-6)})
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setSubmittedOrderUuid(null)} // Permite fazer um novo pedido
          >
            Fazer Novo Pedido
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Fazer Pedido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="cliente">Nome do Cliente</Label>
              <Input
                id="cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                required
                placeholder="Digite seu nome"
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
                placeholder="(XX) XXXXX-XXXX"
              />
            </div>
            <div>
              <Label htmlFor="endereco">Endereço de Entrega</Label>
              <Input
                id="endereco"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                required
                placeholder="Rua, Número, Bairro, Complemento..."
              />
            </div>

            <div>
              <Label htmlFor="pagamento">Meio de Pagamento</Label>
              <Select value={meioPagamento} onValueChange={setMeioPagamento} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
{/* <div className="border-t pt-4"> ... </div> */}

          {/* A seção "Carrinho" agora usa os props */}
          {cart.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">Itens no Pedido:</h3>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="flex-1">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => onUpdateQuantity(item.id, -1)} // Usa prop
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => onUpdateQuantity(item.id, 1)} // Usa prop
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveFromCart(item.id)} // Usa prop
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span className="text-accent">R$ {getTotal()}</span>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || cart.length === 0}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            {loading ? "Enviando..." : "Finalizar Pedido"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
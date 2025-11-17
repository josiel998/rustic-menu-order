import { useState, useMemo , useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { ShoppingCart, Plus, Minus, Trash2,Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const CIDADES_TAXAS: Record<string, { nome: string; taxa: number }[]> = {
  "Mario Campos": [
    { nome: "Centro", taxa: 6.00 },
    { nome: "Primavera", taxa: 6.00 },
    { nome: "Campos Belo", taxa: 6.00 },
    { nome: "Balneário", taxa: 12.00 },
    { nome: "Rádium pra frente", taxa: 7.00 },
    { nome: "Reta 2", taxa: 12.00 },
    { nome: "Funil", taxa: 15.00 },
    { nome: "Tangará", taxa: 4.00 },
    { nome: "Lambaria", taxa: 6.00 },
    { nome: "Bela vista", taxa: 4.00 },
    { nome: "Campo verde", taxa: 6.00 }
  ],
  "Sarzedo": [
    { nome: "Vera Cruz", taxa: 6.00 },
    { nome: "Santa Mônica", taxa: 7.00 },
    { nome: "Planalto", taxa: 6.00 },
    { nome: "Liberdade 2", taxa: 7.00 },
    { nome: "Liberdade 1", taxa: 7.00 },
    { nome: "Bairro Brasília - Início", taxa: 10.00 },
    { nome: "Bairro Brasília - Centro", taxa: 12.00 },
    { nome: "Bairro Brasília - Antenas", taxa: 15.00 },
    { nome: "Serra Azul - Início", taxa: 7.00 }
  ]
};

// Extrai os nomes das cidades para o primeiro select
const CIDADES = Object.keys(CIDADES_TAXAS);

interface BairroData {
  id: number;
  nome: string;
  taxa: number;
}
type ApiDeliveryZones = Record<string, BairroData[]>;


interface MenuItem {
  id: string;
  name: string;
  price: string;
}

interface OrderResponse {
  id: number;
  uuid: string;
  
}

interface CartItem extends MenuItem {
  
  quantity: number;
}

interface OrderFormProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  period: "lunch" | "dinner";
}

export function OrderForm({ cart, onUpdateQuantity, onRemoveFromCart, onClearCart, period }: OrderFormProps) {
  const { toast } = useToast();
  const [telefone, setTelefone] = useState(""); 
  const [endereco, setEndereco] = useState("");
  const [cliente, setCliente] = useState("");
  const [meioPagamento, setMeioPagamento] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedOrderUuid, setSubmittedOrderUuid] = useState<string | null>(null);
  const [tipoEntrega, setTipoEntrega] = useState("entrega"); // 'entrega' ou 'retirada'
  const [observacoes, setObservacoes] = useState("");

  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState(0);
  const [enderecoRua, setEnderecoRua] = useState("");
  const [bairrosFiltrados, setBairrosFiltrados] = useState<BairroData[]>([]); // Usa a interface

  const [allZones, setAllZones] = useState<ApiDeliveryZones>({});
  const [loadingZones, setLoadingZones] = useState(true);


  useEffect(() => {
    const fetchZones = async () => {
      try {
        setLoadingZones(true);
        const data = await api.request<ApiDeliveryZones>('/delivery-zones');
        setAllZones(data);
      } catch (error) {
         toast({
          title: "Erro ao carregar taxas",
          description: "Não foi possível buscar as taxas de entrega.",
          variant: "destructive",
        });
      } finally {
        setLoadingZones(false);
      }
    };
    fetchZones();
  }, [toast]);

  const CIDADES = useMemo(() => Object.keys(allZones), [allZones]);


  const getSubTotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  };

  // Calcula o Total (itens + taxa)
  const getTotal = () => {
    const subTotal = getSubTotal();
    // A taxa só é somada se for entrega; se for retirada, é 0
    const total = subTotal + (tipoEntrega === 'entrega' ? taxaEntrega : 0);
    return total.toFixed(2);
  };
  

  const resetEnderecoFields = () => {
    setCidade("");
    setBairro("");
    setBairrosFiltrados([]);
    setTaxaEntrega(0);
    
  };

  // Atualiza o Tipo de Entrega
  const handleTipoEntregaChange = (value: "entrega" | "retirada") => {
    setTipoEntrega(value);
    // Se mudar para "retirada", zera a taxa e limpa os campos
    if (value === "retirada") {
      resetEnderecoFields();
    }
  };

  // Atualiza a Cidade
 const handleCidadeChange = (cidadeSelecionada: string) => {
    setCidade(cidadeSelecionada);
    setBairro("");
    setTaxaEntrega(0);
    // Filtra a lista de bairros da API
    setBairrosFiltrados(allZones[cidadeSelecionada] || []);
  };

  // Atualiza o Bairro
const handleBairroChange = (bairroSelecionado: string) => {
    setBairro(bairroSelecionado);
    const bairroObj = bairrosFiltrados.find(b => b.nome === bairroSelecionado);
    setTaxaEntrega(bairroObj ? bairroObj.taxa : 0);
  };

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

  // const getTotal = () => {
  //   return cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2);
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione itens ao pedido", variant: "destructive" });
      return;
    }

    let enderecoCompleto = "Retirada no Local";
    
    if (tipoEntrega === 'entrega') {
      if (!cidade || !bairro || !enderecoRua) {
        toast({
          title: "Endereço incompleto",
          description: "Para entrega, selecione cidade, bairro e preencha a rua/número.",
          variant: "destructive",
        });
        return;
      }
      enderecoCompleto = `Entrega em: ${cidade} - ${bairro} (Taxa: R$ ${taxaEntrega.toFixed(2)}). Endereço: ${enderecoRua}`;
    }

    setLoading(true);

    try {
      const newOrder = await api.request<OrderResponse>('/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          cliente,
          telefone,
          endereco: enderecoCompleto,
          meio_pagamento: meioPagamento,
          tipo_entrega: tipoEntrega,
          observacoes: observacoes,
          period: period,
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

      toast({ title: "Pedido realizado!", description: "Seu pedido foi enviado com sucesso." });
      onClearCart();
      setCliente("");
      setTelefone("");
      setMeioPagamento("");
      setObservacoes("");
      resetEnderecoFields();
      setTipoEntrega("entrega");
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

            {/* <div>
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
            </div> */}
          </div>

       <div>
              <Label htmlFor="tipo_entrega">Tipo de Pedido</Label>
              <Select value={tipoEntrega} onValueChange={handleTipoEntregaChange} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrega">Entrega (Delivery)</SelectItem>
                  <SelectItem value="retirada">Retirada no Local</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipoEntrega === 'entrega' && (
              <div className="space-y-4 rounded-md border p-4">
                {/* 5. Adiciona estado de loading ao select de Cidade */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Select value={cidade} onValueChange={handleCidadeChange} required disabled={loadingZones || CIDADES.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingZones ? "Carregando..." : "Selecione a cidade"} />
                      </SelectTrigger>
                      <SelectContent>
                        {CIDADES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="bairro">Bairro</Label>
                    <Select value={bairro} onValueChange={handleBairroChange} required disabled={bairrosFiltrados.length === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o bairro" />
                      </SelectTrigger>
                      <SelectContent>
                        {bairrosFiltrados.map((b) => (
                          <SelectItem key={b.nome} value={b.nome}>
                            {b.nome} - R$ {b.taxa.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="enderecoRua">Rua, Número e Complemento</Label>
                  <Input
                    id="enderecoRua"
                    value={enderecoRua} 
                    onChange={(e) => setEnderecoRua(e.target.value)} 
                    required={tipoEntrega === 'entrega'}
                    placeholder="Ex: Rua das Flores, 123, Apto 101"
                  />
                </div>
              </div>
            )}

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
              
              {/* Bloco condicional para exibir a chave PIX */}
              {meioPagamento === 'pix' && (
                <Alert className="mt-3">
                  <Copy className="h-4 w-4" />
                  <AlertTitle>Chave PIX (Email)</AlertTitle>
                  <AlertDescription className="font-mono text-base break-all">
                    Icaropaulino32@gmail.com
                  </AlertDescription>
                </Alert>
              )}
            </div>
            

            <div>
              <Label htmlFor="observacoes">Observações (Opcional)</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Sem cebola, ponto da carne mal passado, etc."
                rows={3}
              />
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
             <div className="pt-2 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal dos Itens:</span>
                    <span>R$ {getSubTotal().toFixed(2)}</span>
                  </div>
                  {tipoEntrega === 'entrega' && (
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Entrega:</span>
                      <span>R$ {taxaEntrega.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-1">
                    <span>Total:</span>
                    <span className="text-accent">R$ {getTotal()}</span>
                  </div>
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
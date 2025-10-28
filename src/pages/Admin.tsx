import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

// Interface dos dados vindos da API (Português)
interface MenuItem {
  id: string;
  nome: string;
  descricao: string;
  preco: string;
  category: string;
  period: "lunch" | "dinner";
}

const Admin = () => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Estado do formulário (Português)
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    category: "",
    period: "lunch" as "lunch" | "dinner",
  });

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const data = await api.request<MenuItem[]>('/pratos', { requiresAuth: true });
      setMenuItems(data);
    } catch (error) {
      toast({
        title: "Erro ao buscar cardápio",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    try {
      // Prepara os dados (Backend espera 'preco' como número)
      const novoPratoData = {
        ...formData,
        preco: parseFloat(formData.preco),
      };

      const pratoSalvo = await api.request<MenuItem>('/pratos', {
        method: 'POST',
        body: JSON.stringify(novoPratoData),
        requiresAuth: true,
      });

      setMenuItems(pratosAtuais => [pratoSalvo, ...pratosAtuais]);
      setFormData({ nome: "", descricao: "", preco: "", category: "", period: "lunch" });
      
      toast({
        title: "Item adicionado!",
        description: "O prato foi salvo no banco de dados.",
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Verifique os campos";
      toast({
        title: "Erro ao salvar prato",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.request(`/pratos/${id}`, {
        method: 'DELETE',
        requiresAuth: true,
      });
      setMenuItems(menuItems.filter(item => item.id !== id));
      toast({
        title: "Item removido",
        description: "O prato foi removido do banco de dados.",
        variant: "destructive",
      });
    } catch (error) {
       toast({
        title: "Erro ao remover",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const lunchItems = menuItems.filter(item => item.period === "lunch");
  const dinnerItems = menuItems.filter(item => item.period === "dinner");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-display font-bold mb-8 animate-fade-in">
          Gerenciar Cardápio
        </h1>
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="shadow-elevated animate-fade-in">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Adicionar Novo Prato</CardTitle></CardHeader>
            <CardContent>
              {/* Formulário (já estava correto, usando 'nome' e 'preco') */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Prato</Label>
                  <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required placeholder="Ex: Feijoada Completa" />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} required placeholder="Descreva os ingredientes e acompanhamentos" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preco">Preço (R$)</Label>
                    <Input id="preco" type="number" step="0.01" value={formData.preco} onChange={(e) => setFormData({ ...formData, preco: e.target.value })} required placeholder="0.00" />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required placeholder="Ex: Prato Principal" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="period">Período</Label>
                  <Select value={formData.period} onValueChange={(value: "lunch" | "dinner") => setFormData({ ...formData, period: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lunch">Almoço</SelectItem>
                      <SelectItem value="dinner">Jantar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loadingSubmit}>
                  {loadingSubmit ? (<Loader2 className="h-4 w-4 mr-2 animate-spin" />) : (<Plus className="h-4 w-4 mr-2" />)}
                  {loadingSubmit ? "Salvando..." : "Adicionar ao Cardápio"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4 animate-fade-in-delay">
            <h2 className="text-2xl font-display font-semibold">Itens do Cardápio</h2>
            <Tabs defaultValue="lunch">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lunch">Almoço</TabsTrigger>
                <TabsTrigger value="dinner">Jantar</TabsTrigger>
              </TabsList>
              
              {loading ? (
                <p className="text-muted-foreground text-center py-4">Carregando...</p>
              ) : (
                <>
                  <TabsContent value="lunch" className="space-y-3 mt-4">
                    {lunchItems.length === 0 && <p className="text-muted-foreground text-center">Nenhum item de almoço.</p>}
                    {/* 👇 CORREÇÃO AQUI: Renderiza 'item.nome' e 'item.preco' 👇 */}
                    {lunchItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="flex justify-between items-start p-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{item.nome}</h3>
                            <p className="text-sm text-muted-foreground mb-1">{item.descricao}</p>
                            <p className="text-accent font-semibold">R$ {item.preco}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="dinner" className="space-y-3 mt-4">
                     {dinnerItems.length === 0 && <p className="text-muted-foreground text-center">Nenhum item de jantar.</p>}
                     {/* 👇 CORREÇÃO AQUI: Renderiza 'item.nome' e 'item.preco' 👇 */}
                    {dinnerItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="flex justify-between items-start p-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{item.nome}</h3>
                            <p className="text-sm text-muted-foreground mb-1">{item.descricao}</p>
                            <p className="text-accent font-semibold">R$ {item.preco}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
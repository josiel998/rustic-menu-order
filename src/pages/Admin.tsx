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
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import api from "@/lib/api";
import { echo } from "@/lib/echo";

// Interface dos dados vindos da API (Português)
interface MenuItem {
  id: string;
  nome: string;
  descricao: string;
  preco: string;
  preco_pequeno?: string | null;
  category: string;
  period: "lunch" | "dinner";
  imagem_url?: string | null;
}

interface PratoCriadoEvent { prato: MenuItem; }
interface PratoUpdatedEvent { prato: MenuItem; }
// (Você também pode adicionar PratoDeletadoEvent se quiser)

// NOVO: Tipo para o formulário (sem o ID)
type PratoFormData = Omit<MenuItem, "id">;

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
    preco_pequeno: "",
    category: "",
    period: "lunch" as "lunch" | "dinner",
    imagem_url: "",
  });

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editFormData, setEditFormData] = useState<PratoFormData | null>(null);

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
 

  const channel = echo.channel('pratos');

    // 1. Ouvir por PRATOS CRIADOS
    channel.listen('.PratoCriado', (event: PratoCriadoEvent) => {
      console.log('Admin ouviu PratoCriado', event.prato);
      setMenuItems(pratosAtuais => [event.prato, ...pratosAtuais]);
    });

    // 2. Ouvir por PRATOS ATUALIZADOS
    channel.listen('.PratoUpdated', (event: PratoUpdatedEvent) => {
      console.log('Admin ouviu PratoUpdated', event.prato);
      setMenuItems(pratosAtuais =>
        pratosAtuais.map(item => 
          item.id === event.prato.id ? event.prato : item // Substitui o item antigo
        )
      );
    });
    
    // (Você pode adicionar .listen('.PratoDeletado', ...) aqui)

    return () => {
      channel.stopListening('.PratoCriado');
      channel.stopListening('.PratoUpdated'); // NOVO
      echo.leave('pratos');
    };
    // --- Fim do WebSocket ---

  }, []);


  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    try {
      // Prepara os dados (Backend espera 'preco' como número)
      const novoPratoData = {
        ...formData,
        preco: parseFloat(formData.preco),
        preco_pequeno: formData.preco_pequeno ? parseFloat(formData.preco_pequeno) : null,
        imagem_url: formData.imagem_url || null,
      };

      const pratoSalvo = await api.request<MenuItem>('/pratos', {
        method: 'POST',
        body: JSON.stringify(novoPratoData),
        requiresAuth: true,
      });

      // setMenuItems(pratosAtuais => [pratoSalvo, ...pratosAtuais]);
      setFormData({ nome: "", descricao: "", preco: "", preco_pequeno: "", category: "", period: "lunch" , imagem_url: "",});
      
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

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item); // Salva o item que está sendo editado (incluindo o ID)
    setEditFormData({    // Preenche o formulário do modal
      nome: item.nome,
      descricao: item.descricao,
      preco: item.preco,
      category: item.category,
      period: item.period,
      imagem_url: item.imagem_url || "",
    });
  };

  const handleCloseEditModal = () => {
    setEditingItem(null);
    setEditFormData(null);
  };

  // 3. Atualiza o estado do formulário de edição
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editFormData) return;
    setEditFormData({
      ...editFormData,
      [e.target.id]: e.target.value,
    });
  };

  // 4. (Para o <Select>)
  const handleEditSelectChange = (field: 'period', value: "lunch" | "dinner") => {
     if (!editFormData) return;
     setEditFormData({
       ...editFormData,
       [field]: value,
     });
  };

  // 5. Envia a atualização para a API
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editFormData) return;

    setLoadingSubmit(true);
    try {
      const dadosAtualizados = {
        ...editFormData,
        preco: parseFloat(editFormData.preco),
        imagem_url: editFormData.imagem_url || null,
      };

      // Envia requisição PATCH (ou PUT)
      const pratoAtualizado = await api.request<MenuItem>(`/pratos/${editingItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify(dadosAtualizados),
        requiresAuth: true,
      });

      // Atualiza o estado local (WebSocket também fará isso)
      // setMenuItems(menuItems.map(item => item.id === pratoAtualizado.id ? pratoAtualizado : item));
      
      handleCloseEditModal();
      toast({ title: "Prato atualizado!", description: `${pratoAtualizado.nome} foi salvo.` });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Verifique os campos";
      toast({ title: "Erro ao atualizar", description: errorMsg, variant: "destructive" });
    } finally {
      setLoadingSubmit(false);
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
        {/* NOVO CAMPO: Prato Pequeno */}
        <Label htmlFor="preco_pequeno">Preço Pequeno (R$)</Label>
        <Input 
            id="preco_pequeno" 
            type="number" 
            step="0.01" 
            value={formData.preco_pequeno} 
            onChange={(e) => setFormData({ ...formData, preco_pequeno: e.target.value })} 
            placeholder="0.00 (Opcional)" 
        />
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

                <div>
                  <Label htmlFor="imagem_url">URL da Imagem (Opcional)</Label>
                  <Input
                    id="imagem_url"
                    value={formData.imagem_url || ""}
                    onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })}
                    placeholder="https://exemplo.com/foto.jpg"
                  />
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
                        <div className="flex-shrink-0 flex gap-2">
                             <Button variant="outline" size="icon" onClick={() => handleOpenEditModal(item)} className="hover:border-primary">
                                <Pencil className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-destructive hover:text-destructive-foreground">
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
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
                         <div className="flex-shrink-0 flex gap-2">
                             <Button variant="outline" size="icon" onClick={() => handleOpenEditModal(item)} className="hover:border-primary">
                                <Pencil className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-destructive hover:text-destructive-foreground">
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
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

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && handleCloseEditModal()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Prato: {editingItem?.nome}</DialogTitle>
          </DialogHeader>
          {/* Renderiza o formulário APENAS se os dados estiverem prontos */}
          {editFormData && (
            <form onSubmit={handleUpdateSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="nome">Nome do Prato</Label>
                <Input id="nome" value={editFormData.nome} onChange={handleEditFormChange} required />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" value={editFormData.descricao} onChange={handleEditFormChange} required rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preco">Preço (R$)</Label>
                  <Input id="preco" type="number" step="0.01" value={editFormData.preco} onChange={handleEditFormChange} required />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input id="category" value={editFormData.category} onChange={handleEditFormChange} required />
                </div>
              </div>
              <div>
                <Label htmlFor="period">Período</Label>
                <Select value={editFormData.period} onValueChange={(v) => handleEditSelectChange('period', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lunch">Almoço</SelectItem>
                    <SelectItem value="dinner">Jantar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div>
                  <Label htmlFor="imagem_url">URL da Imagem (Opcional)</Label>
                  <Input id="imagem_url" value={editFormData.imagem_url || ""} onChange={handleEditFormChange} placeholder="https://exemplo.com/imagem.jpg" />
                </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleCloseEditModal}>Cancelar</Button>
                <Button type="submit" disabled={loadingSubmit}>
                  {loadingSubmit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Mudanças
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
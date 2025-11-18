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
import { Plus, Trash2, Loader2, Pencil, Upload, ImageOff, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import api from "@/lib/api";
import { echo } from "@/lib/echo";





// Interface para as Zonas de Entrega
interface BairroData {
  id: number;
  nome: string;
  taxa: number;
}
interface ApiDeliveryZones {
  [cidade: string]: BairroData[];
}
// Interface para o formulário de nova zona
interface NewZoneData {
  cidade: string;
  bairro: string;
  taxa: string;
}

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const [deliveryZones, setDeliveryZones] = useState<ApiDeliveryZones>({});
  const [loadingZones, setLoadingZones] = useState(true);
  const [newZoneData, setNewZoneData] = useState<NewZoneData>({ cidade: "", bairro: "", taxa: "" });
  const [loadingZoneSubmit, setLoadingZoneSubmit] = useState(false);

  const [isEditZoneModalOpen, setIsEditZoneModalOpen] = useState(false);
  const [loadingEditZoneSubmit, setLoadingEditZoneSubmit] = useState(false);
  // Guarda os dados do bairro que está sendo editado (ID, cidade, bairro, taxa)
  const [editingZoneData, setEditingZoneData] = useState<{
    id: number;
    cidade: string;
    bairro: string;
    taxa: string;
  } | null>(null);

   const [editImageFile, setEditImageFile] = useState<File | null>(null);

   const fetchDeliveryZones = async () => {
    try {
      setLoadingZones(true);
      const data = await api.request<ApiDeliveryZones>('/delivery-zones', { requiresAuth: true });
      setDeliveryZones(data);
    } catch (error) {
      toast({
        title: "Erro ao buscar zonas de entrega",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoadingZones(false);
    }
  };

  // Carrega as zonas quando o componente monta
  useEffect(() => {
    fetchDeliveryZones();
  }, []);

  // Handler para o formulário de nova zona
  const handleNewZoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewZoneData({
      ...newZoneData,
      [e.target.id]: e.target.value,
    });
  };

  // Envia a nova zona para a API
  const handleAddZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingZoneSubmit(true);
    try {
      // Usamos a rota POST de admin
      await api.request('/delivery-zones', {
        method: 'POST',
        body: JSON.stringify({
          ...newZoneData,
          taxa: parseFloat(newZoneData.taxa) // Converte para número
        }),
        requiresAuth: true,
      });

      toast({ title: "Zona de entrega adicionada!" });
      setNewZoneData({ cidade: "", bairro: "", taxa: "" }); // Limpa o formulário
      fetchDeliveryZones(); // Atualiza a lista

    } catch (error) {
      toast({
        title: "Erro ao salvar zona",
        description: error instanceof Error ? error.message : "Verifique os campos",
        variant: "destructive",
      });
    } finally {
      setLoadingZoneSubmit(false);
    }
  };

  // Deleta uma zona de entrega
  const handleDeleteZone = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este bairro?")) return;

    try {
      // Usa a rota DELETE de admin
      await api.request(`/delivery-zones/${id}`, {
        method: 'DELETE',
        requiresAuth: true,
      });
      toast({ title: "Bairro removido", variant: "destructive" });
      fetchDeliveryZones(); // Atualiza a lista
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleOpenEditZoneModal = (bairro: BairroData, cidade: string) => {
    setEditingZoneData({
      id: bairro.id,
      cidade: cidade,
      bairro: bairro.nome,
      taxa: bairro.taxa.toString(), // Converte para string para o input
    });
    setIsEditZoneModalOpen(true);
  };

  // 2. Fecha o modal e limpa o estado
  const handleCloseEditZoneModal = () => {
    setIsEditZoneModalOpen(false);
    setEditingZoneData(null);
  };

  // 3. Atualiza o estado do formulário de edição
  const handleEditZoneFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingZoneData) return;
    setEditingZoneData({
      ...editingZoneData,
      [e.target.id]: e.target.value,
    });
  };

  // 4. Envia a atualização (PUT) para a API
  const handleUpdateZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZoneData) return;

    setLoadingEditZoneSubmit(true);
    try {
      // A rota é /delivery-zones/{id} e o método é PUT
      await api.request(`/delivery-zones/${editingZoneData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          cidade: editingZoneData.cidade,
          bairro: editingZoneData.bairro,
          taxa: parseFloat(editingZoneData.taxa) // Envia como número
        }),
        requiresAuth: true,
      });
      toast({ title: "Zona de entrega atualizada!" });
      handleCloseEditZoneModal();
      fetchDeliveryZones(); // Recarrega a lista
    } catch (error) {
      toast({
        title: "Erro ao atualizar zona",
        description: error instanceof Error ? error.message : "Verifique os campos",
        variant: "destructive",
      });
    } finally {
      setLoadingEditZoneSubmit(false);
    }
  };

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


   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };


  

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    
    // Se há um arquivo selecionado, usamos FormData
    if (selectedFile) {
        const dataToSend = new FormData();
        dataToSend.append('nome', formData.nome);
        dataToSend.append('descricao', formData.descricao);
        dataToSend.append('preco', formData.preco.toString());
        
        if (formData.preco_pequeno) {
            dataToSend.append('preco_pequeno', formData.preco_pequeno.toString());
        }
        
        dataToSend.append('category', formData.category);
        dataToSend.append('period', formData.period);
        dataToSend.append('imagem', selectedFile); // O arquivo

        try {
          await api.postFormData<MenuItem>('/pratos', dataToSend, { requiresAuth: true });
        } catch (error) {
           const errorMsg = error instanceof Error ? error.message : "Verifique os campos";
           toast({ title: "Erro ao salvar prato", description: errorMsg, variant: "destructive" });
        }
        
    } else {
        // Se NÃO há arquivo, usamos o fluxo JSON existente (URL ou sem imagem)
        try {
          const novoPratoData = {
            ...formData,
            preco: parseFloat(formData.preco),
            preco_pequeno: formData.preco_pequeno ? parseFloat(formData.preco_pequeno) : null,
            imagem_url: formData.imagem_url || null,
          };

          await api.request<MenuItem>('/pratos', {
            method: 'POST',
            body: JSON.stringify(novoPratoData),
            requiresAuth: true,
          });

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Verifique os campos";
          toast({ title: "Erro ao salvar prato", description: errorMsg, variant: "destructive" });
        }
    }
    
    // Independentemente do fluxo (JSON ou FormData), limpa o formulário no final
    if (!selectedFile) {
        // Limpar o formulário apenas se não houve erro no catch
        setFormData({ nome: "", descricao: "", preco: "", preco_pequeno: "", category: "", period: "lunch" , imagem_url: "",});
        toast({ title: "Item adicionado!", description: "O prato foi salvo no banco de dados.", });
    } else {
        // Limpar tudo para o fluxo FormData
        setFormData({ nome: "", descricao: "", preco: "", preco_pequeno: "", category: "", period: "lunch" , imagem_url: "",});
        setSelectedFile(null);
        toast({ title: "Item adicionado!", description: "O prato foi salvo no banco de dados.", });
    }

    setLoadingSubmit(false);
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
       preco_pequeno: item.preco_pequeno || "",
      category: item.category,
      period: item.period,
      imagem_url: item.imagem_url || "",
    });
    setSelectedFile(null);
  };

  const handleCloseEditModal = () => {
    setEditingItem(null);
    setEditFormData(null);
    setEditImageFile(null); 
  };

  // 3. Atualiza o estado do formulário de edição
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editFormData) return;
    setEditFormData({
      ...editFormData,
      [e.target.id]: e.target.value,
    });
  };

   const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditImageFile(e.target.files[0]);
      // Limpa o campo URL se um arquivo local for selecionado
      setEditFormData(prev => ({ ...prev!, imagem_url: "" }));
    } else {
      setEditImageFile(null);
    }
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
    
    // Define o endpoint da API
    const endpoint = `/pratos/${editingItem.id}`;

    try {
      const preco = parseFloat(editFormData.preco);
      const precoPequeno = editFormData.preco_pequeno ? parseFloat(editFormData.preco_pequeno) : null;
      
      // Variável para armazenar a resposta da API
      let pratoAtualizado: MenuItem; 

      if (editImageFile) {
        // --- FLUXO 1: UPLOAD LOCAL (FormData) ---
        const dataToSend = new FormData();
        
        // Adiciona todos os campos
        dataToSend.append('nome', editFormData.nome);
        dataToSend.append('descricao', editFormData.descricao);
        dataToSend.append('preco', preco.toString());
        dataToSend.append('category', editFormData.category);
        dataToSend.append('period', editFormData.period);
        if (precoPequeno) {
          dataToSend.append('preco_pequeno', precoPequeno.toString());
        }
        dataToSend.append('imagem', editImageFile); // O novo arquivo
        dataToSend.append('_method', 'PUT'); // Método para o Laravel (já que FormData só usa POST)

        
        pratoAtualizado = await api.postFormData<MenuItem>(endpoint, dataToSend, {
            requiresAuth: true,
        });

      } else {
        // --- FLUXO 2: URL EXTERNA / SEM IMAGEM (JSON) ---
        const dadosAtualizados = {
          ...editFormData,
          preco: preco,
          preco_pequeno: precoPequeno,
          imagem_url: editFormData.imagem_url || null, 
        };
        
       
        pratoAtualizado = await api.request<MenuItem>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(dadosAtualizados),
            requiresAuth: true,
        });
      }
      
      

      setMenuItems(pratosAtuais =>
        pratosAtuais.map(item => 
          item.id === pratoAtualizado.id ? pratoAtualizado : item
        )
      );

      handleCloseEditModal();
      toast({ title: "Prato atualizado!", description: `O prato foi salvo.` });

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
              {/* Formulário de Pratos */}
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
                    <Label htmlFor="preco_pequeno">Preço Pequeno (R$)</Label>
                    <Input id="preco_pequeno" type="number" step="0.01" value={formData.preco_pequeno} onChange={(e) => setFormData({ ...formData, preco_pequeno: e.target.value })} placeholder="0.00 (Opcional)" />
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
                  <Label htmlFor="imagem_upload" className="flex items-center gap-1"> <Upload className="h-4 w-4 text-primary" /> Upload de Imagem (Local) </Label>
                  <Input id="imagem_upload" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                  {selectedFile && ( <p className="text-xs text-muted-foreground mt-1">Arquivo selecionado: {selectedFile.name}</p> )}
                </div>
                <div>
                  <Label htmlFor="imagem_url">URL da Imagem (Opcional)</Label>
                  <Input id="imagem_url" value={formData.imagem_url || ""} onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })} placeholder="https://exemplo.com/foto.jpg" disabled={!!selectedFile} />
                  <p className="text-xs text-muted-foreground mt-1">Use URL externa OU Upload local.</p>
                </div>
                <Button type="submit" className="w-full" disabled={loadingSubmit}>
                  {loadingSubmit ? (<Loader2 className="h-4 w-4 mr-2 animate-spin" />) : (<Plus className="h-4 w-4 mr-2" />)}
                  {loadingSubmit ? "Salvando..." : "Adicionar ao Cardápio"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Pratos */}
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
                    {lunchItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="flex justify-between items-start p-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{item.nome}</h3>
                            <p className="text-sm text-muted-foreground mb-1">{item.descricao}</p>
                            <p className="text-accent font-semibold">R$ {item.preco}</p>
                          </div>
                        <div className="flex-shrink-0 flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleOpenEditModal(item)} className="hover:border-primary"> <Pencil className="h-4 w-4" /> </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-destructive hover:text-destructive-foreground"> <Trash2 className="h-4 w-4" /> </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="dinner" className="space-y-3 mt-4">
                     {dinnerItems.length === 0 && <p className="text-muted-foreground text-center">Nenhum item de jantar.</p>}
                    {dinnerItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="flex justify-between items-start p-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{item.nome}</h3>
                            <p className="text-sm text-muted-foreground mb-1">{item.descricao}</p>
                            <p className="text-accent font-semibold">R$ {item.preco}</p>
                          </div>
                         <div className="flex-shrink-0 flex gap-2">
                             <Button variant="outline" size="icon" onClick={() => handleOpenEditModal(item)} className="hover:border-primary"> <Pencil className="h-4 w-4" /> </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-destructive hover:text-destructive-foreground"> <Trash2 className="h-4 w-4" /> </Button>
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
        
        {/* --- INÍCIO DA NOVA SEÇÃO (Gerenciar Entregas) --- */}
        <div className="my-16 border-t pt-12">
          <h1 className="text-4xl font-display font-bold mb-8 animate-fade-in">
            Gerenciar Entregas
          </h1>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Coluna 1: Adicionar Nova Zona */}
            <Card className="shadow-elevated animate-fade-in">
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Adicionar Novo Bairro</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddZoneSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="cidade">Nome da Cidade</Label>
                    <Input id="cidade" value={newZoneData.cidade} onChange={handleNewZoneChange} required placeholder="Ex: Mario Campos" />
                  </div>
                  <div>
                    <Label htmlFor="bairro">Nome do Bairro</Label>
                    <Input id="bairro" value={newZoneData.bairro} onChange={handleNewZoneChange} required placeholder="Ex: Centro" />
                  </div>
                  <div>
                    <Label htmlFor="taxa">Taxa (R$)</Label>
                    <Input id="taxa" type="number" step="0.01" value={newZoneData.taxa} onChange={handleNewZoneChange} required placeholder="6.00" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loadingZoneSubmit}>
                    {loadingZoneSubmit ? (<Loader2 className="h-4 w-4 mr-2 animate-spin" />) : (<Plus className="h-4 w-4 mr-2" />)}
                    {loadingZoneSubmit ? "Salvando..." : "Adicionar Bairro"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Coluna 2: Lista de Zonas Existentes */}
            <div className="space-y-4 animate-fade-in-delay">
              <h2 className="text-2xl font-display font-semibold">Bairros Cadastrados</h2>
              {loadingZones ? (
                <p className="text-muted-foreground text-center py-4">Carregando...</p>
              ) : (
                // Agrupa por cidade
                Object.keys(deliveryZones).sort().map(cidade => (
                  <div key={cidade}>
                    <h3 className="font-bold text-lg mb-2">{cidade}</h3>
                    <div className="space-y-3">
                      {deliveryZones[cidade].length === 0 && <p>Nenhum bairro para esta cidade.</p>}
                      {deliveryZones[cidade].map((bairro) => (
                        <Card key={bairro.id}>
                          <CardContent className="flex justify-between items-center p-4">
                            <div className="flex-1">
                              <h4 className="font-semibold">{bairro.nome}</h4>
                              <p className="text-accent font-semibold">R$ {bairro.taxa.toFixed(2)}</p>
                            </div>
                          <div className="flex-shrink-0 flex gap-2">
                              {/* Botão de Editar agora está funcional */}
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="hover:border-primary"
                                onClick={() => handleOpenEditZoneModal(bairro, cidade)}
                              > 
                                <Pencil className="h-4 w-4" /> 
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteZone(bairro.id)} 
                                className="hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
              {/* Se não houver nenhuma zona cadastrada */}
              {!loadingZones && Object.keys(deliveryZones).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Nenhum bairro cadastrado. Comece adicionando um ao lado.</p>
              )}
            </div>
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
                  <Label htmlFor="preco">Preço Grande (R$)</Label>
                  <Input id="preco" type="number" step="0.01" value={editFormData.preco} onChange={handleEditFormChange} required />
                </div>
                <div>
                  <Label htmlFor="preco_pequeno">Preço Pequeno (R$)</Label>
                  {/* @ts-ignore */}
                  <Input id="preco_pequeno" type="number" step="0.01" value={editFormData.preco_pequeno || ""} onChange={handleEditFormChange} placeholder="0.00 (Opcional)" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input id="category" value={editFormData.category} onChange={handleEditFormChange} required />
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
              </div>
               <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="edit_imagem_upload" className="flex items-center gap-1">
                    <Upload className="h-4 w-4 text-primary" />
                    Substituir Imagem (Local)
                  </Label>
                  <Input
                    id="edit_imagem_upload"
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileChange}
                    className="cursor-pointer"
                  />
                  {editImageFile && (
                    <p className="text-xs text-muted-foreground mt-1">Novo arquivo: {editImageFile.name}. A URL abaixo será ignorada.</p>
                  )}
              </div>

              {/* CAMPO URL DA IMAGEM (Alternativa/Atual) */}
              <div>
                  <Label htmlFor="imagem_url">URL da Imagem Atual (Opcional)</Label>
                  <Input 
                    id="imagem_url" 
                    value={editFormData.imagem_url || ""} 
                    onChange={handleEditFormChange} 
                    placeholder="https://exemplo.com/imagem.jpg" 
                    disabled={!!editImageFile} // Desabilita se houver upload local
                  />
                  <p className="text-xs text-muted-foreground mt-1">URL atual será mantida, a menos que um arquivo local seja enviado acima.</p>
              </div>

               {/* Preview da imagem atual/nova */}
              <div className="mt-4">
                    <Label>Preview da Imagem</Label>
                    <div className="h-32 w-full border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
                        {editImageFile ? (
                             // Preview da nova imagem (local)
                            <img 
                                src={URL.createObjectURL(editImageFile)} 
                                alt="Nova Imagem do Prato" 
                                className="h-full w-full object-cover"
                            />
                        ) : editFormData.imagem_url ? (
                            // Imagem existente (URL)
                            <img 
                                src={editFormData.imagem_url} 
                                alt="Imagem Atual do Prato" 
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-sm text-gray-500 flex items-center"><ImageOff className="h-4 w-4 mr-1"/> Nenhuma imagem definida.</span>
                        )}
                    </div>
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

      <Dialog open={isEditZoneModalOpen} onOpenChange={setIsEditZoneModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Zona de Entrega</DialogTitle>
          </DialogHeader>
          {/* Renderiza o formulário só se os dados estiverem prontos */}
          {editingZoneData && (
            <form onSubmit={handleUpdateZoneSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="cidade">Nome da Cidade</Label>
                <Input id="cidade" value={editingZoneData.cidade} onChange={handleEditZoneFormChange} required />
              </div>
              <div>
                <Label htmlFor="bairro">Nome do Bairro</Label>
                <Input id="bairro" value={editingZoneData.bairro} onChange={handleEditZoneFormChange} required />
              </div>
              <div>
                <Label htmlFor="taxa">Taxa (R$)</Label>
                <Input id="taxa" type="number" step="0.01" value={editingZoneData.taxa} onChange={handleEditZoneFormChange} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleCloseEditZoneModal}>Cancelar</Button>
                <Button type="submit" disabled={loadingEditZoneSubmit}>
                  {loadingEditZoneSubmit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
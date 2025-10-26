import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  period: "lunch" | "dinner";
}

const Admin = () => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: "1", name: "Feijoada Completa", description: "Feijão preto com carnes selecionadas, arroz, couve e farofa", price: "35.90", category: "Prato Principal", period: "lunch" },
    { id: "2", name: "Bife à Parmegiana", description: "Bife empanado com molho de tomate e queijo derretido, acompanha arroz e batata frita", price: "42.90", category: "Prato Principal", period: "lunch" },
    { id: "3", name: "Moqueca de Peixe", description: "Peixe fresco com leite de coco, dendê e temperos especiais", price: "48.90", category: "Prato Principal", period: "dinner" },
    { id: "4", name: "Pudim de Leite", description: "Sobremesa tradicional cremosa com calda de caramelo", price: "12.00", category: "Sobremesa", period: "lunch" },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    period: "lunch" as "lunch" | "dinner",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: MenuItem = {
      id: Date.now().toString(),
      ...formData,
    };
    setMenuItems([...menuItems, newItem]);
    setFormData({ name: "", description: "", price: "", category: "", period: "lunch" });
    toast({
      title: "Item adicionado!",
      description: "O prato foi adicionado ao cardápio com sucesso.",
    });
  };

  const handleDelete = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
    toast({
      title: "Item removido",
      description: "O prato foi removido do cardápio.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-display font-bold mb-8 animate-fade-in">
          Gerenciar Cardápio
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="shadow-elevated animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar Novo Prato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Prato</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ex: Feijoada Completa"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Descreva os ingredientes e acompanhamentos"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      placeholder="Ex: Prato Principal"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="period">Período</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value: "lunch" | "dinner") => setFormData({ ...formData, period: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lunch">Almoço</SelectItem>
                      <SelectItem value="dinner">Jantar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar ao Cardápio
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
              
              <TabsContent value="lunch" className="space-y-3 mt-4">
                {menuItems.filter(item => item.period === "lunch").map((item) => (
                  <Card key={item.id}>
                    <CardContent className="flex justify-between items-start p-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
                        <p className="text-accent font-semibold">R$ {item.price}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="dinner" className="space-y-3 mt-4">
                {menuItems.filter(item => item.period === "dinner").map((item) => (
                  <Card key={item.id}>
                    <CardContent className="flex justify-between items-start p-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
                        <p className="text-accent font-semibold">R$ {item.price}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;

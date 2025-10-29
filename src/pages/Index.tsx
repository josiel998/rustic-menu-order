import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { MenuCard } from "@/components/MenuCard";
import { OrderForm } from "@/components/OrderForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import heroImage from "@/assets/hero-restaurant.jpg";
import { api } from "@/lib/api";
import { echo } from "@/lib/echo";
import { useToast } from "@/hooks/use-toast";

// Interface dos dados vindos da API (Português)
interface MenuItemFromDB {
  id: string;
  nome: string;
  descricao: string;
  preco: string;
  category: string;
  period: "lunch" | "dinner";
  imagem_url?: string | null;
}

interface PratoCriadoEvent {
  prato: MenuItemFromDB;
}

// Interface que o OrderForm espera (Inglês)
interface OrderFormItem {
  id: string;
  name: string;
  price: string;
}

interface CartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
}

interface PratoCriadoEvent { prato: MenuItemFromDB; }
interface PratoUpdatedEvent { prato: MenuItemFromDB; }


const Index = () => {
  const [menuItems, setMenuItems] = useState<MenuItemFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);


  const addToCart = (item: MenuItemFromDB) => {
    const existing = cart.find(i => i.id === item.id);
    
    if (existing) {
      setCart(cart.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      // Traduz de Português (DB) para Inglês (Cart)
      const cartItem: CartItem = {
        id: item.id,
        name: item.nome,
        price: item.preco,
        quantity: 1,
      };
      setCart([...cart, cartItem]);
    }
    toast({ title: "Item adicionado!", description: `${item.nome} foi para o carrinho.` });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ).filter(item => item.quantity > 0)); // Remove se a quantidade for 0
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };
  
  const clearCart = () => {
    setCart([]);
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const data = await api.request<MenuItemFromDB[]>('/pratos');
        setMenuItems(data);
      } catch (error) {
        console.error("Erro ao buscar cardápio:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();

    const channel = echo.channel('pratos');
    channel.listen('.PratoCriado', (event: PratoCriadoEvent) => {
      setMenuItems(pratosAtuais => [event.prato, ...pratosAtuais]);
    });
   

  channel.listen('.PratoUpdated', (event: PratoUpdatedEvent) => {
      console.log('Index ouviu PratoUpdated', event.prato);
      setMenuItems(pratosAtuais =>
        pratosAtuais.map(item => 
          item.id === event.prato.id ? event.prato : item // Substitui o item antigo
        )
      );
    });

    // 3. Limpeza
    return () => {
      channel.stopListening('.PratoCriado');
      channel.stopListening('.PratoUpdated'); // NOVO
      echo.leave('pratos');
    };

  }, []);

  

  const lunchMenu = menuItems.filter(item => item.period === 'lunch');
  const dinnerMenu = menuItems.filter(item => item.period === 'dinner');
  const allMenuItemsForOrderForm: OrderFormItem[] = menuItems.map(item => ({
    id: item.id,
    name: item.nome,
    price: item.preco
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero (sem mudanças) */}
      <section className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-start text-primary-foreground">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-4 animate-fade-in">Bom Sabor</h1>
          <p className="text-xl md:text-2xl max-w-2xl animate-fade-in-delay">Comida tradicional feita com carinho, como na casa da vovó</p>
        </div>
      </section>

      {/* Menu Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-display font-bold mb-4">Nosso Cardápio</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Pratos preparados diariamente com ingredientes frescos e selecionados</p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Carregando cardápio...</p>
        ) : (
          <>
            <Tabs defaultValue="lunch" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
                <TabsTrigger value="lunch" className="text-lg">Almoço</TabsTrigger>
                <TabsTrigger value="dinner" className="text-lg">Jantar</TabsTrigger>
              </TabsList>
              
             <TabsContent value="lunch">
               <div className="grid md:grid-cols-2 gap-6">
                  {/* MODIFICADO: Passamos o 'item' inteiro, que agora inclui 'imagem_url' */}
                  {lunchMenu.map((item) => (
                    <MenuCard 
                      key={item.id} 
                      item={item} // Passa o objeto completo
                      onAddToCart={() => addToCart(item)}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="dinner">
                {dinnerMenu.length === 0 && <p>...</p>}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* MODIFICADO: Passamos o 'item' inteiro, que agora inclui 'imagem_url' */}
                  {dinnerMenu.map((item) => (
                    <MenuCard 
                      key={item.id} 
                      item={item} // Passa o objeto completo
                      onAddToCart={() => addToCart(item)}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          <section className="py-12 mt-16">
              <div className="max-w-2xl mx-auto">
                {/* MODIFICADO: Passa o carrinho e as funções de gerenciamento para o OrderForm */}
                <OrderForm 
                  cart={cart}
                  onUpdateQuantity={updateQuantity}
                  onRemoveFromCart={removeFromCart}
                  onClearCart={clearCart}
                />
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer (sem mudanças) */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p className="font-body">© 2024 Restaurante Bom Sabor. Feito com carinho.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
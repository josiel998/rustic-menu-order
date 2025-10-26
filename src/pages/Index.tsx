import { Header } from "@/components/Header";
import { MenuCard } from "@/components/MenuCard";
import { OrderForm } from "@/components/OrderForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import heroImage from "@/assets/hero-restaurant.jpg";

const Index = () => {
  const lunchMenu = [
    {
      id: "1",
      name: "Feijoada Completa",
      description: "Feijão preto com carnes selecionadas, arroz branco, couve refogada, farofa crocante e laranja",
      price: "35.90",
      category: "Prato Principal"
    },
    {
      id: "2",
      name: "Bife à Parmegiana",
      description: "Bife empanado coberto com molho de tomate caseiro e queijo derretido, acompanha arroz e batata frita",
      price: "42.90",
      category: "Prato Principal"
    },
    {
      id: "3",
      name: "Frango Grelhado",
      description: "Peito de frango grelhado com legumes salteados e arroz integral",
      price: "32.90",
      category: "Prato Principal"
    },
    {
      id: "4",
      name: "Pudim de Leite",
      description: "Sobremesa tradicional cremosa com calda de caramelo",
      price: "12.00",
      category: "Sobremesa"
    },
  ];

  const dinnerMenu = [
    {
      id: "5",
      name: "Moqueca de Peixe",
      description: "Peixe fresco com leite de coco, dendê, tomates e temperos especiais, servido com arroz branco e pirão",
      price: "48.90",
      category: "Prato Principal"
    },
    {
      id: "6",
      name: "Risoto de Camarão",
      description: "Arroz arbóreo cremoso com camarões frescos, alho-poró e parmesão",
      price: "52.90",
      category: "Prato Principal"
    },
    {
      id: "7",
      name: "Costela ao Molho",
      description: "Costela bovina ao molho especial da casa, acompanha polenta cremosa",
      price: "45.90",
      category: "Prato Principal"
    },
    {
      id: "8",
      name: "Torta de Limão",
      description: "Base crocante com recheio cremoso de limão e merengue",
      price: "14.00",
      category: "Sobremesa"
    },
  ];

  const allMenuItems = [...lunchMenu, ...dinnerMenu];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[500px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-start text-primary-foreground">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-4 animate-fade-in">
            Bom Sabor
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl animate-fade-in-delay">
            Comida tradicional feita com carinho, como na casa da vovó
          </p>
        </div>
      </section>

      {/* Menu Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-display font-bold mb-4">Nosso Cardápio</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pratos preparados diariamente com ingredientes frescos e selecionados
          </p>
        </div>

        <Tabs defaultValue="lunch" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
            <TabsTrigger value="lunch" className="text-lg">Almoço</TabsTrigger>
            <TabsTrigger value="dinner" className="text-lg">Jantar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lunch">
            <div className="grid md:grid-cols-2 gap-6">
              {lunchMenu.map((item, index) => (
                <MenuCard key={index} {...item} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="dinner">
            <div className="grid md:grid-cols-2 gap-6">
              {dinnerMenu.map((item, index) => (
                <MenuCard key={index} {...item} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <section className="py-12 mt-16">
          <div className="max-w-2xl mx-auto">
            <OrderForm menuItems={allMenuItems} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p className="font-body">© 2024 Restaurante Bom Sabor. Feito com carinho.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

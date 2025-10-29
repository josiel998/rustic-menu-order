import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // NOVO: Importa o Botão
import { Plus } from "lucide-react";

interface MenuCardProps {
  item: {
    nome: string;
    descricao: string;
    preco: string;
    category: string;
    imagem_url?: string | null;
  };
  onAddToCart: () => void; // NOVO: Função para ser chamada ao clicar
}



export const MenuCard = ({ item, onAddToCart }: MenuCardProps) => {
  // Define o estilo de fundo dinamicamente
  const backgroundStyle = item.imagem_url 
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${item.imagem_url})` }
    : {}; // Sem imagem, sem estilo de fundo
  
  const hasImage = !!item.imagem_url;
  return (
  <Card className="relative hover:shadow-elevated transition-all duration-300 animate-fade-in flex flex-col group overflow-hidden rounded-lg">

      {/* Bloco da Imagem (h-64, igual antes) */}
      {item.imagem_url && (
        <div className="w-full h-64 overflow-hidden">
          <img
            src={item.imagem_url}
            alt={item.nome}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* MODIFICADO: Padding inferior aumentado (pb-16) para dar espaço ao botão */}
      <div className="flex flex-col flex-1 p-4 pb-16"> {/* Aumenta o padding bottom */}
        <div className="flex-1"> 
          <CardHeader className="p-0">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{item.nome}</CardTitle>
                <Badge variant="secondary" className="mb-2">{item.category}</Badge>
              </div>
              <span className="text-2xl font-display font-semibold text-accent">
                R$ {item.preco}
              </span>
            </div>
            <CardDescription className="text-base leading-relaxed pt-2">
              {item.descricao}
            </CardDescription>
          </CardHeader>
        </div>
        
        {/* MODIFICADO: 
            1. Botão 'size="sm"' (pequeno) 
            2. Espaço acima 'mt-4' (menor)
        */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          onClick={onAddToCart}
          variant="outline"
          size="sm" // Botão pequeno
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>
      </div>

    </Card>
  );
};

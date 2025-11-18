import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // NOVO: Importa o Botão
import { Plus } from "lucide-react";
import * as React from "react";

interface MenuCardProps {
  item: {
    nome: string;
    descricao: string;
    preco: string;
    preco_pequeno?: string | null;
    category: string;
    imagem_url?: string | null;
  };
 onAddToCart: (selectedPrice: string, selectedName: string) => void;  // NOVO: Função para ser chamada ao clicar
}





export const MenuCard = ({ item, onAddToCart }: MenuCardProps) => {
  // Define o estilo de fundo dinamicamente
  const backgroundStyle = item.imagem_url 
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${item.imagem_url})` }
    : {}; // Sem imagem, sem estilo de fundo
  const hasMultiplePrices = !!item.preco_pequeno && item.preco !== item.preco_pequeno;

  // Estado local para rastrear qual opção está selecionada por padrão (Grande)
  const [selectedOption, setSelectedOption] = 
    React.useState<'grande' | 'pequeno'>(item.preco_pequeno ? 'pequeno' : 'grande');

  const selectedPrice = 
    selectedOption === 'pequeno' && item.preco_pequeno
      ? item.preco_pequeno
      : item.preco;

  const selectedName = 
    selectedOption === 'pequeno' && item.preco_pequeno
      ? `${item.nome} (Pequeno)`
      : `${item.nome} (Grande)`;

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

     <div className="flex flex-col flex-1 p-4"> 
        <div className="flex-1"> 
          <CardHeader className="p-0 pb-4">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{item.nome}</CardTitle>
                <Badge variant="secondary" className="mb-2">{item.category}</Badge>
              </div>

              {/* MANTÉM A EXIBIÇÃO DOS PREÇOS (Visão geral) */}
              <div className="flex flex-col items-end">
                  {item.preco_pequeno && (
                  <span className="text-2xl font-display font-semibold text-accent">
                          P: R$ {item.preco_pequeno}
                  </span>
                  )}
                  <span className="text-2xl font-display font-semibold text-accent">
                      {item.preco_pequeno ? "G: " : ""} R$ {item.preco}
                  </span>
              </div>
            </div>
            <CardDescription className="text-base leading-relaxed pt-2">
              {item.descricao}
            </CardDescription>
          </CardHeader>
        </div>

          <div className="mt-4 pt-4 border-t border-dashed">

           {/* 1. TÍTULO DE INSTRUÇÃO */}
           {hasMultiplePrices && (
                <p className="text-sm font-medium text-foreground mb-2">
                    Selecione o tamanho do prato:
                </p>
           )}

           {/* 2. LINHA FLEXÍVEL DE BOTÕES (Horizontal em Desktop, Stacked em Mobile) */}
           <div className={hasMultiplePrices ? "flex flex-col sm:flex-row justify-between items-center gap-3" : "flex justify-end items-center"}>
            
        
        {/* --- NOVO: SELEÇÃO DE PREÇO --- */}
        {hasMultiplePrices && (
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                        type="button" 
                        variant={selectedOption === 'pequeno' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedOption('pequeno')}
                        className="flex-1"
                    >
                        Pequeno
                    </Button>
                    <Button 
                        type="button" 
                        variant={selectedOption === 'grande' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedOption('grande')}
                        className="flex-1"
                    >
                        Grande
                    </Button>
                </div>
            )}

            {/* BOTÃO ADICIONAR (Sempre à direita, alinhado com o grupo de tamanho) */}
            <Button
              onClick={() => onAddToCart(selectedPrice, selectedName)} 
              variant="default"
              size="sm" 
              className={hasMultiplePrices ? "w-full sm:w-auto mt-0" : "mt-0"}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar R$ {selectedPrice}
            </Button>
           </div>
        </div>
      </div>

    </Card>
  );
};
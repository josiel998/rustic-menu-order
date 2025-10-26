import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MenuCardProps {
  name: string;
  description: string;
  price: string;
  category: string;
}

export const MenuCard = ({ name, description, price, category }: MenuCardProps) => {
  return (
    <Card className="hover:shadow-elevated transition-all duration-300 animate-fade-in">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{name}</CardTitle>
            <Badge variant="secondary" className="mb-2">{category}</Badge>
          </div>
          <span className="text-2xl font-display font-semibold text-accent">
            R$ {price}
          </span>
        </div>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, LogOut, ShoppingBag, Phone } from "lucide-react";

export const Header = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b bg-card shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
        <div className="flex items-center gap-6"> 
            <Link to="/" className="flex items-center gap-2 group">
              <UtensilsCrossed className="h-8 w-8 text-primary group-hover:text-accent transition-colors" />
              <span className="text-2xl font-display font-bold">Bom Sabor</span>
            </Link>

            {/* --- INÍCIO DA MUDANÇA: NÚMEROS DE CONTATO --- */}
            {/* Escondido em telas pequenas (mobile) para não quebrar o layout */}
            <div className="hidden lg:flex items-center gap-4 text-sm text-foreground">
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-primary" />
                <span>+55 31 9585-6444</span>
              </div>
              {/* <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-primary" />
                <span>+55 31 9835-3994</span>
              </div> */}
            </div>
            </div>
          
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost">Cardápio</Button>
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/admin">
                  <Button variant="outline">Admin</Button>
                </Link>
                <Link to="/orders">
                  <Button variant="outline" className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Pedidos
                  </Button>
                </Link>
                <Button variant="ghost" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="default">Login</Button>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

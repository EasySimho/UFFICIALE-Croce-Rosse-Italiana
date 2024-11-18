import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Person, FoodItem } from "../types";
import { api } from "../api";
import Logo from "../../public/Emblema_CRI.svg";
import LoadingSpinner from "./LoadingSpinner";

export function StoragePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [foodItems, setFoodItems] = useState<Partial<FoodItem>[]>([
    { productName: "", quantity: 0, units: 0 },
  ]);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const data = await api.getPeople();
      setPeople(data);
    } catch (error) {
      console.error("Failed to load people:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleAddFoodItem = () => {
    setFoodItems([...foodItems, { productName: "", quantity: 0, units: 0 }]);
  };

  const handleRemoveFoodItem = (index: number) => {
    setFoodItems(foodItems.filter((_, i) => i !== index));
  };

  const updateFoodItem = (index: number, updates: Partial<FoodItem>) => {
    setFoodItems(
      foodItems.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
    if (updates.productName) {
      searchProductImage(updates.productName, index).then((imageUrl) => {
        if (imageUrl) {
          setFoodItems((items) =>
            items.map((item, i) => (i === index ? { ...item, imageUrl } : item))
          );
        }
      });
    }
  };

  const handleAddFood = async () => {
    if (!selectedPerson || foodItems.some(item => !item.productName || !item.quantity || !item.units)) {
      console.error("Validation failed:", foodItems);
      return;
    }
  
    try {
      setLoading(true);
  
      // Replace entire foodList instead of appending
      const updatedPerson = {
        ...selectedPerson,
        foodList: foodItems.map(item => ({
          id: crypto.randomUUID(),
          productName: item.productName!,
          quantity: item.quantity!,
          units: item.units!,
          imageUrl: item.imageUrl
        }))
      };
  
      // Update in DB
      const response = await api.updatePerson(selectedPerson.id, updatedPerson);
      
      // Update local state with server response
      setPeople(currentPeople => 
        currentPeople.map(p => 
          p.id === selectedPerson.id ? response : p
        )
      );
  
      // Reset form
      setFoodItems([{ productName: '', quantity: 0, units: 0 }]);
      setSelectedPerson(null);
  
    } catch (error) {
      console.error('Failed to update food list:', error);
      alert('Errore nel salvataggio della lista alimentare. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const searchProductImage = async (
    productName: string,
    index: number
  ): Promise<string | null> => {
    try {
      setImageLoading(prev => ({ ...prev, [index]: true }));
      
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          productName
        )}+food&client_id=F_vg2QXwoYD-i80RJb6H7Cnjb_SaS2bFaQJokgSrCGw`
      );
      const data = await response.json();
      return data.results?.[0]?.urls?.small || null;
    } catch (error) {
      console.error("Failed to fetch product image:", error);
      return null;
    } finally {
      setImageLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-red-600 dark:bg-red-800 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={Logo} alt="Logo CRI" className="h-12 w-12" />
              <h1 className="text-2xl font-bold">Gestione Magazzino</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-700 dark:bg-red-900 hover:bg-red-800 dark:hover:bg-red-950 px-3 py-1 rounded-md transition-colors"
            >
              <LogOut size={16} />
              Esci
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {people.map((person) => (
            <div
              key={person.id}
              className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md ${
                person.foodList?.length
                  ? "border-l-4 border-green-500"
                  : "border-l-4 border-blue-500"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    {person.surname} {person.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Composizione Nucleo: {person.adults} adulti,{" "}
                    {person.children} minori
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPerson(person);
                    // Replace foodItems with existing list or empty item
                    setFoodItems(
                      person.foodList?.length 
                        ? person.foodList.map(item => ({
                            productName: item.productName,
                            quantity: item.quantity,
                            units: item.units,
                            imageUrl: item.imageUrl
                          }))
                        : [{ productName: '', quantity: 0, units: 0 }]
                    );
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <Plus size={16} />
                  {person.foodList?.length ? "Modifica Lista" : "Crea Lista"}
                </button>
              </div>

              {person.foodList && person.foodList.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {person.foodList.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md"
                    >
                      {imageLoading[index] ? (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                          <LoadingSpinner/>
                        </div>
                      ) : item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                          <ImageIcon className="text-gray-400" size={24} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.quantity}g × {item.units} unità
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">
              Lista Alimentare - {selectedPerson.surname} {selectedPerson.name}
            </h2>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {foodItems.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Prodotto #{index + 1}</h3>
                    {foodItems.length > 1 && (
                      <button
                        onClick={() => handleRemoveFoodItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Rimuovi
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Prodotto
                      </label>
                      <input
                        type="text"
                        value={item.productName || ""}
                        onChange={(e) =>
                          updateFoodItem(index, { productName: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Nome del prodotto"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Quantità (g)
                      </label>
                      <input
                        type="number"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          updateFoodItem(index, {
                            quantity: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Grammi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Unità
                      </label>
                      <input
                        type="number"
                        value={item.units || ""}
                        onChange={(e) =>
                          updateFoodItem(index, {
                            units: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Numero pezzi"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={handleAddFoodItem}
                className="text-red-600 hover:text-red-800 flex items-center gap-2"
              >
                <Plus size={16} />
                Aggiungi Prodotto
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedPerson(null);
                    setFoodItems([{ productName: "", quantity: 0, units: 0 }]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annulla
                </button>
                <button
                  onClick={handleAddFood}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                >
                  Salva Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

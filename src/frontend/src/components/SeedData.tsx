import { useQueryClient } from "@tanstack/react-query";
/**
 * Sample products to seed the backend on first load.
 * Called once from the app when no products exist.
 * Uses getAdminActor directly to ensure admin auth for createProduct.
 */
import { useEffect, useRef } from "react";
import { createActorWithConfig } from "../config";
import { useGetAllProducts } from "../hooks/useQueries";

const ADMIN_TOKEN = "1995@Bhawna";

async function getAdminActor() {
  const actor = await createActorWithConfig();
  try {
    await (actor as any)._initializeAccessControlWithSecret(ADMIN_TOKEN);
  } catch {
    // ignore — may already be initialized
  }
  return actor;
}

const SAMPLE_PRODUCTS = [
  {
    id: "prod_001",
    name: "Samsung Galaxy S24 5G",
    manufacturer: "Samsung",
    category: "Smartphones",
    price: BigInt(74999),
    description:
      '6.2" Dynamic AMOLED display, Snapdragon 8 Gen 3, 50MP triple camera system, 5000mAh battery.',
    imageUrl: "/assets/generated/product-smartphone.dim_400x400.jpg",
    stockQuantity: BigInt(25),
    additionalDetails:
      "Color: Phantom Black\nRAM: 8GB\nStorage: 256GB\nWarranty: 1 Year Samsung India\nIn-box: Cable, Adapter, SIM ejector tool",
    isAvailable: true,
  },
  {
    id: "prod_002",
    name: "Sony WH-1000XM5 Wireless Headphones",
    manufacturer: "Sony",
    category: "Headphones",
    price: BigInt(29990),
    description:
      "Industry-leading noise cancellation with 8 microphones, 30-hour battery life, multipoint connection.",
    imageUrl: "/assets/generated/product-headphones.dim_400x400.jpg",
    stockQuantity: BigInt(15),
    additionalDetails:
      "Color: Black\nConnectivity: Bluetooth 5.2\nBattery: 30 hours (NC on)\nWarranty: 1 Year Sony India\nFolding: Yes, foldable",
    isAvailable: true,
  },
  {
    id: "prod_003",
    name: "Anker PowerCore 20000 PD",
    manufacturer: "Anker",
    category: "Power Banks",
    price: BigInt(3499),
    description:
      "20,000mAh capacity, 65W USB-C PD output, can charge laptops, phones, and tablets simultaneously.",
    imageUrl: "/assets/generated/product-powerbank.dim_400x400.jpg",
    stockQuantity: BigInt(40),
    additionalDetails:
      "Capacity: 20,000mAh\nPorts: 1x USB-C PD (65W), 2x USB-A (15W each)\nInput: USB-C 45W\nWeight: 340g\nWarranty: 18 Months Anker",
    isAvailable: true,
  },
  {
    id: "prod_004",
    name: "boAt Airdopes 141 TWS Earbuds",
    manufacturer: "boAt",
    category: "Earbuds",
    price: BigInt(1299),
    description:
      "42 hours playtime, ASAP charge, IPX4 water resistance, immersive BEAST™ mode sound.",
    imageUrl: "/assets/generated/product-earbuds.dim_400x400.jpg",
    stockQuantity: BigInt(60),
    additionalDetails:
      "Driver: 8mm Dynamic\nBluetooth: 5.3\nTotal Playback: 42 hours\nIPX Rating: IPX4\nWarranty: 1 Year boAt India",
    isAvailable: true,
  },
  {
    id: "prod_005",
    name: "Portronics USB-C to USB-C Braided Cable 2m",
    manufacturer: "Portronics",
    category: "Cables",
    price: BigInt(499),
    description:
      "2-meter braided nylon cable supporting 100W fast charging and 480Mbps data transfer.",
    imageUrl: "/assets/generated/product-cable.dim_400x400.jpg",
    stockQuantity: BigInt(100),
    additionalDetails:
      "Length: 2 Meters\nMaterial: Braided Nylon + Aluminum\nMax Wattage: 100W PD\nData Transfer: 480 Mbps\nCompatible: All USB-C devices\nWarranty: 6 Months",
    isAvailable: true,
  },
  {
    id: "prod_006",
    name: "Wipro Smart LED Desk Lamp 9W",
    manufacturer: "Wipro",
    category: "Smart Gadgets",
    price: BigInt(1799),
    description:
      "Touch control, 5-level dimming, warm to cool white (3000K-6500K), USB charging port built-in.",
    imageUrl: "/assets/generated/product-lamp.dim_400x400.jpg",
    stockQuantity: BigInt(30),
    additionalDetails:
      "Wattage: 9W LED\nColor Temperature: 3000K – 6500K\nDimming: 5 levels touch control\nUSB Port: 5V/1A charging\nBase: Weighted anti-slip\nWarranty: 2 Years Wipro",
    isAvailable: true,
  },
];

export default function SeedData() {
  const { data: products, isLoading } = useGetAllProducts();
  const qc = useQueryClient();
  const seeded = useRef(false);

  useEffect(() => {
    // Only seed when admin is logged in
    const isAdmin = localStorage.getItem("owAdmin") === "1";
    if (!isAdmin || isLoading || seeded.current) return;
    if (products && products.length === 0) {
      seeded.current = true;
      // Seed products sequentially using admin actor directly
      const seedAll = async () => {
        try {
          const actor = await getAdminActor();
          for (const product of SAMPLE_PRODUCTS) {
            try {
              await actor.createProduct(product);
            } catch {
              // Silently fail — product may already exist
            }
          }
          qc.invalidateQueries({ queryKey: ["products"] });
        } catch {
          // Silently fail — admin auth may not be available yet
        }
      };
      seedAll();
    }
  }, [products, isLoading, qc]);

  return null;
}

"use client";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Quagga from "@ericblade/quagga2";

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
}
interface PurchaseItem {
  product_id: number;
  product_code: string;
  product_name: string;
  product_price: number;
  quantity: number;
  total: number; // Added for display purposes
}

interface Order {
  emp_cd: string;
  items: OrderItem[];
}

interface OrderItem {
  product_id: number;
  product_code: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface OrderResponse {
  message: string;
  order_id: number;
  total_amount: number;
  total_amount_ex_tax: number;
}

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
}

const API_BASE_URL =
  "https://tech0-gen-7-step4-studentwebapp-pos-8-h0bja8ghfcd0ayat.eastus-01.azurewebsites.net";

export default function Home() {
  const [productCode, setProductCode] = useState<string>("");
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    if (isScanning) {
      startQuagga();
    } else {
      stopQuagga();
    }

    return () => stopQuagga();
  }, [isScanning]);

  const handleCreateProduct = useCallback(async (barcode: string) => {
    const name = prompt("新規商品の名前を入力してください:");
    if (!name) {
      handleAlert("商品名が入力されていません。");
      return;
    }

    const priceString = prompt("商品の価格を入力してください:");
    if (!priceString) {
      handleAlert("価格が入力されていません。");
      return;
    }

    const price = parseInt(priceString);
    if (isNaN(price) || price <= 0) {
      handleAlert("有効な価格を入力してください。");
      return;
    }

    try {
      const params = new URLSearchParams({
        name: name,
        price: price.toString(),
        code: barcode,
      });

      const response = await fetch(
        `${API_BASE_URL}/create_product/?${params.toString()}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          handleAlert("この商品コードは既に登録されています。");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data) {
        setCurrentProduct({
          id: data.id,
          code: data.code,
          name: data.name,
          price: data.price,
        });
        handleAlert(`新商品「${data.name}」が登録されました。`);
      }
    } catch (error) {
      handleApiError(error);
      setCurrentProduct(null);
    }
  }, []);

  const handleProductFetch = useCallback(async () => {
    if (!productCode) {
      handleAlert("商品コードを入力してください。");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/product/${productCode}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.log("Product not found, creating new product");
          await handleCreateProduct(productCode);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("API Response:", data);
      if (data) {
        setCurrentProduct({
          id: data.id,
          code: productCode,
          name: data.name,
          price: data.price,
        });
      }
    } catch (error) {
      handleApiError(error);
      setCurrentProduct(null);
    }
  }, [productCode, handleCreateProduct]);

  const stopQuagga = useCallback(() => {
    Quagga.stop();
    Quagga.offDetected();
  }, []);

  const startQuagga = useCallback(() => {
    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: document.querySelector("#scanner-container") || undefined,
          constraints: {
            facingMode: "environment",
            width: 480,
            height: 320,
          },
        },
        decoder: {
          readers: [
            "ean_reader",
            "code_128_reader",
            "upc_reader",
            "ean_8_reader",
          ],
        },
      },
      (err) => {
        if (err) return console.error("Error initializing Quagga:", err);
        Quagga.start();
      }
    );

    Quagga.onDetected(async (data) => {
      if (data?.codeResult?.code) {
        setProductCode(data.codeResult.code);
        setIsScanning(false);
        stopQuagga();
        await handleProductFetch();
      }
    });
  }, [handleProductFetch]);

  const handleAlert = (message: string) => {
    alert(message);
  };

  const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      handleAlert(`エラーが発生しました: ${error.message}`);
    } else if (error instanceof Error) {
      handleAlert(`エラーが発生しました: ${error.message}`);
    } else {
      handleAlert("不明なエラーが発生しました");
    }
  };

  const handleAddToCart = () => {
    if (currentProduct) {
      const existingItemIndex = purchaseList.findIndex(
        (item) => item.product_code === currentProduct.code
      );

      if (existingItemIndex > -1) {
        // Update existing item quantity
        const updatedList = [...purchaseList];
        updatedList[existingItemIndex].quantity += 1;
        updatedList[existingItemIndex].total =
          updatedList[existingItemIndex].quantity *
          updatedList[existingItemIndex].product_price;
        setPurchaseList(updatedList);
      } else {
        // Add new item
        const newItem: PurchaseItem = {
          product_id: currentProduct.id,
          product_code: currentProduct.code,
          product_name: currentProduct.name,
          product_price: currentProduct.price,
          quantity: 1,
          total: currentProduct.price,
        };
        setPurchaseList([...purchaseList, newItem]);
      }
      handleAlert(
        `商品「${currentProduct.name}」が購入リストに追加されました。`
      );
      resetFields();
    }
  };

  const handlePurchase = async () => {
    if (purchaseList.length === 0) {
      handleAlert("購入リストが空です。");
      return;
    }

    const order: Order = {
      emp_cd: "9999999999", // デフォルト値
      items: purchaseList.map(
        ({
          product_id,
          product_code,
          product_name,
          product_price,
          quantity,
        }) => ({
          product_id,
          product_code,
          product_name,
          product_price,
          quantity,
        })
      ),
    };

    try {
      const response = await axios.post<OrderResponse>(
        `${API_BASE_URL}/orders`,
        order
      );
      const { total_amount, total_amount_ex_tax } = response.data;
      handleAlert(
        `購入が完了しました。\n` +
          `合計金額（税込）: ${total_amount}円\n` +
          `合計金額（税抜）: ${total_amount_ex_tax}円`
      );
      setPurchaseList([]);
    } catch (error) {
      handleApiError(error);
    }
  };

  const resetFields = () => {
    setProductCode("");
    setCurrentProduct(null);
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl bg-yellow-100 rounded-3xl shadow-lg">
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-orange-800 font-retro">
          よみとるよん！
        </h1>
        <div className="mb-6 flex flex-col items-center">
          <Button
            className={`w-full sm:w-1/2 ${buttonVariants({
              variant: "outline",
            })} mb-4 px-6 py-3 text-lg rounded-lg shadow-md bg-orange-900 text-white hover:bg-orange-400`}
            onClick={() => setIsScanning(!isScanning)}
          >
            {isScanning ? "スキャン停止" : "スキャン（カメラ）"}
          </Button>
          <div
            id="scanner-container"
            style={{
              width: "280px",
              height: "180px",
              marginBottom: "1rem",
              position: "relative",
              zIndex: "50",
            }}
          >
            {!isScanning && (
              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                <p className="text-brown-700 text-center">カメラ停止中...</p>
              </div>
            )}
          </div>
          <Input
            type="text"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            onBlur={handleProductFetch}
            placeholder="商品コードを入力"
            className="mb-4 w-full sm:w-1/2 rounded-lg border border-brown-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brown-500 text-center font-retro"
          />
        </div>
        <div className="mb-6 flex flex-col items-center">
          <Input
            type="text"
            value={currentProduct?.name || ""}
            readOnly
            placeholder="商品名"
            className="mb-4 w-full sm:w-1/2 rounded-lg border border-brown-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brown-500 text-center font-retro"
          />
          <Input
            type="text"
            value={currentProduct?.price ? `${currentProduct.price}円` : ""}
            readOnly
            placeholder="単価"
            className="mb-4 w-full sm:w-1/2 rounded-lg border border-brown-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brown-500 text-center font-retro"
          />
          <Button
            className={`w-full sm:w-1/2 ${buttonVariants({
              variant: "outline",
            })} px-6 py-3 text-lg rounded-lg bg-orange-900 text-white shadow-md hover:bg-orange-400`}
            onClick={handleAddToCart}
            disabled={!currentProduct}
          >
            追加
          </Button>
        </div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-center text-orange-800 font-retro">
            購入リスト
          </h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* ヘッダー行 */}
            <div className="grid grid-cols-4 gap-2 bg-orange-900 text-white p-3 text-sm font-bold">
              <div className="text-left">商品名</div>
              <div className="text-right">単価</div>
              <div className="text-center">数量</div>
              <div className="text-right">小計</div>
            </div>

            {/* 商品リスト */}
            <div className="max-h-[300px] overflow-auto">
              {purchaseList.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  商品がありません
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {purchaseList.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 gap-2 p-3 items-center hover:bg-orange-50"
                    >
                      <div className="font-medium text-orange-900 truncate">
                        {item.product_name}
                      </div>
                      <div className="text-right text-gray-600">
                        ¥{item.product_price.toLocaleString()}
                      </div>
                      <div className="text-center text-gray-600">
                        {item.quantity}
                      </div>
                      <div className="text-right font-bold text-orange-900">
                        ¥{item.total.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 合計金額表示 */}
            {purchaseList.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="p-4 bg-orange-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">小計</span>
                    <span>
                      ¥
                      {purchaseList
                        .reduce((sum, item) => sum + item.total, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">消費税（10%）</span>
                    <span>
                      ¥
                      {Math.floor(
                        purchaseList.reduce(
                          (sum, item) => sum + item.total,
                          0
                        ) * 0.1
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-orange-900 pt-2 border-t border-gray-200">
                    <span className="font-bold">合計</span>
                    <span className="text-xl font-bold">
                      ¥
                      {Math.floor(
                        purchaseList.reduce(
                          (sum, item) => sum + item.total,
                          0
                        ) * 1.1
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <Button
                    className={`w-full ${buttonVariants({
                      variant: "outline",
                    })} px-6 py-3 text-lg rounded-lg bg-green-600 text-white shadow-md hover:bg-green-500`}
                    onClick={handlePurchase}
                  >
                    購入する
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

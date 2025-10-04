# 🏦 KipuBank

KipuBank es un contrato inteligente en Solidity que permite a los usuarios depositar y retirar **ETH nativo** en una bóveda personal, respetando límites 
de seguridad y buenas prácticas de desarrollo.

## ✨ Características

- Los usuarios pueden **depositar ETH** en una bóveda personal.
- Los retiros tienen un **umbral máximo por transacción** (`withdrawalThreshold`, `immutable`).
- Existe un **límite global de depósitos** (`bankCap`) definido en el despliegue.
- Se registran los **contadores de depósitos y retiros**, tanto globales como por usuario.
- Los depósitos y retiros generan **eventos** (`DepositMade`, `WithdrawalMade`).
- **Seguridad aplicada**:
  - Errores personalizados en vez de `require` con strings.
  - Patrón **checks-effects-interactions**.
  - **Reentrancy guard** para evitar ataques.
  - Manejo seguro de transferencias de ETH con `call`.
  - `receive` y `fallback` bloquean envíos directos.

---

## 🛠️ Tecnologías utilizadas
- Solidity **`^0.8.30`**
- Remix IDE / Hardhat / Foundry
- Testnet **Sepolia** o **Holesky**

---

## 📦 Despliegue en Testnet (Remix)

1. Abrí [Remix IDE](https://remix.ethereum.org/).
2. Creá un archivo en `/contracts/KipuBank.sol` y pega el contrato.
3. Compilá con **Solidity 0.8.19**.
4. En la pestaña **Deploy & Run**, seleccioná:
   - **Environment**: Injected Provider - MetaMask.
   - **Constructor Parameters**:
     - `bankCap`: límite global de ETH (ejemplo: `100 ether`).
     - `withdrawalThreshold`: límite de retiro por transacción (ejemplo: `1 ether`).
5. Presioná **Deploy** y confirmá la transacción en MetaMask.
6. Una vez desplegado, copiá la **dirección del contrato** y guárdala.

---

## 📋 Uso del contrato

### Depositar
```solidity
KipuBank.deposit{value: 1 ether}();

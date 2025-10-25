// SPDX-License-Identifier: MIT


pragma solidity >=0.8.0;
 


/// @title KipuBank - Banco descentralizado con límites de retiro y registro de actividad.
/// @author Felipe A. Cristaldo
/// @notice Permite a los usuarios depositar y retirar ETH dentro de límites definidos.
/// @dev Cumple con buenas prácticas de seguridad y documentación NatSpec.
contract KipuBank {
    /*//////////////////////////////////////////////////////////////
                            📢 EVENTOS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emite un evento cuando un usuario realiza un depósito exitoso.
    /// @param user Dirección del usuario que deposita.
    /// @param amount Monto depositado.
    event Deposit(address indexed user, uint256 amount);

    /// @notice Emite un evento cuando un usuario realiza un retiro exitoso.
    /// @param user Dirección del usuario que retira.
    /// @param amount Monto retirado.
    event Withdrawal(address indexed user, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                            ❌ ERRORES PERSONALIZADOS
    //////////////////////////////////////////////////////////////*/

    /// @notice Se lanza cuando el propietario inicial es inválido (dirección cero).
    error ErrInvalidOwner();

    /// @notice Se lanza cuando el monto es cero o inválido.
    error ErrZeroAmount();

    /// @notice Se lanza cuando el usuario intenta retirar más de su balance.
    error ErrInsufficientBalance();

    /// @notice Se lanza cuando el monto de retiro supera el límite permitido.
    error ErrOverWithdrawalLimit();

    /// @notice Se lanza cuando se intenta superar el límite total del banco.
    error ErrBankCapReached();

    /*//////////////////////////////////////////////////////////////
                            ⚙️ VARIABLES DE ESTADO
    //////////////////////////////////////////////////////////////*/

    /// @notice Dirección del propietario del contrato.
    address public immutable owner;

    /// @notice Límite máximo de retiro por transacción (inmutable).
    uint256 public immutable withdrawalLimit;

    /// @notice Capacidad total máxima del banco en ETH.
    uint256 public immutable bankCap;

    /// @notice Registro de balances de cada usuario.
    mapping(address => uint256) private _balances;

    /// @notice Contador de depósitos realizados.
    uint256 private _depositCount;

    /// @notice Contador de retiros realizados.
    uint256 private _withdrawalCount;

    /*//////////////////////////////////////////////////////////////
                            🏗️ CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @param _withdrawalLimit Límite de retiro máximo por transacción.
    /// @param _bankCap Capacidad total del banco.
    /// @dev Valida los parámetros y asigna el owner.
    constructor(uint256 _withdrawalLimit, uint256 _bankCap) {
        if (msg.sender == address(0)) revert ErrInvalidOwner();
        owner = msg.sender;
        withdrawalLimit = _withdrawalLimit;
        bankCap = _bankCap;
    }

    /*//////////////////////////////////////////////////////////////
                            🔐 MODIFICADORES
    //////////////////////////////////////////////////////////////*/

    /// @notice Restringe el acceso solo al propietario del contrato.
    modifier onlyOwner() {
        if (msg.sender != owner) revert ErrInvalidOwner();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            💰 FUNCIONES PÚBLICAS
    //////////////////////////////////////////////////////////////*/

    /// @notice Permite depositar ETH en la bóveda personal.
    /// @dev Usa patrón Checks-Effects-Interactions.
    /// @dev Emite un evento al finalizar el depósito.
    function deposit() external payable {
        if (msg.value == 0) revert ErrZeroAmount();
        if (address(this).balance > bankCap) revert ErrBankCapReached();

        _balances[msg.sender] += msg.value;
        _incrementDepositCount();

        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Permite retirar ETH de la bóveda personal.
    /// @param amount Monto a retirar.
    /// @dev Verifica límites y disponibilidad.
    function withdraw(uint256 amount) external {
        if (amount == 0) revert ErrZeroAmount();
        if (amount > withdrawalLimit) revert ErrOverWithdrawalLimit();
        if (amount > _balances[msg.sender]) revert ErrInsufficientBalance();

        _balances[msg.sender] -= amount;
        _incrementWithdrawalCount();

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                            🔍 FUNCIONES DE VISTA
    //////////////////////////////////////////////////////////////*/

    /// @notice Consulta el balance de un usuario.
    /// @param user Dirección del usuario a consultar.
    /// @return El balance actual del usuario.
    function getBalance(address user) external view returns (uint256) {
        return _balances[user];
    }

    /// @notice Devuelve el número total de depósitos realizados.
    function getDepositCount() external view returns (uint256) {
        return _depositCount;
    }

    /// @notice Devuelve el número total de retiros realizados.
    function getWithdrawalCount() external view returns (uint256) {
        return _withdrawalCount;
    }

    /*//////////////////////////////////////////////////////////////
                            🔒 FUNCIONES PRIVADAS
    //////////////////////////////////////////////////////////////*/

    /// @dev Incrementa el contador de depósitos (usa unchecked para optimizar gas).
    function _incrementDepositCount() private {
        unchecked {
            ++_depositCount;
        }
    }

    /// @dev Incrementa el contador de retiros (usa unchecked para optimizar gas).
    function _incrementWithdrawalCount() private {
        unchecked {
            ++_withdrawalCount;
        }
    }
}



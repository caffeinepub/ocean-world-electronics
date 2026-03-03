import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Array "mo:core/Array";
import Migration "migration";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Apply migration
(with migration = Migration.run)
actor {
  // Authorization Setup
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Storage setup
  include MixinStorage();

  // Types
  type OrderStatus = {
    #pending;
    #confirmed;
    #shipped;
    #out_for_delivery;
    #delivered;
    #cancelled;
  };

  type Product = {
    id : Text;
    name : Text;
    manufacturer : Text;
    category : Text;
    price : Nat;
    description : Text;
    imageUrl : Text;
    stockQuantity : Nat;
    additionalDetails : Text;
    isAvailable : Bool;
  };

  public type Order = {
    id : Text;
    customerName : Text;
    phone : Text;
    address : Text;
    quantity : Nat;
    productId : Text;
    specialDescription : Text;
    status : OrderStatus;
    timestamp : Int;
    courierName : ?Text;
    courierTrackingNumber : ?Text;
  };

  type Inquiry = {
    name : Text;
    phone : Text;
    message : Text;
    timestamp : Int;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    phone : Text;
  };

  type MonthlySales = {
    month : Nat;
    year : Nat;
    orderCount : Nat;
    revenue : Nat;
  };

  type ProductSales = {
    productId : Text;
    productName : Text;
    totalQuantity : Nat;
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Text.compare(p1.id, p2.id);
    };
  };

  // Storage
  let products = Map.empty<Text, Product>();
  let orders = Map.empty<Text, Order>();
  let inquiries = Map.empty<Text, Inquiry>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Initialization
  public shared ({ caller }) func initialize() : async () {
    AccessControl.initialize(accessControlState, caller, "bhawna paneru", "1995@Bhawna");

    // Seed products if not already seeded
    if (products.isEmpty()) {
      let sampleProducts = [
        {
          id = "1";
          name = "Smartphone X";
          manufacturer = "Apple";
          category = "Smartphone";
          price = 800;
          description = "Latest Apple smartphone with advanced camera features.";
          imageUrl = "https://as1.ftcdn.net/v2/jpg/06/62/45/59/500_F_662455986_1cAI9sIHh4Al4DGYRgTqzk7A1U2fi8cr.jpg";
          stockQuantity = 50;
          additionalDetails = "5G, Retina Display, Face ID";
          isAvailable = true;
        },
        {
          id = "2";
          name = "Phone Charger";
          manufacturer = "Samsung";
          category = "Accessory";
          price = 15;
          description = "Fast charging adapter compatible with most Android devices.";
          imageUrl = "https://media.istockphoto.com/id/1433980276/photo/smartphone-and-charger-on-white-background.webp?b=1&s=170667a&w=0&k=20&c=6K4fnuRBUbxxxtkEtKscjIGl6dT72FOuN8sRsd9rojM=";
          stockQuantity = 100;
          additionalDetails = "USB-C, 2A Output";
          isAvailable = true;
        },
        {
          id = "3";
          name = "Knitted Socks";
          manufacturer = "ACME Co.";
          category = "Accessory";
          price = 10;
          description = "Warm and cozy knitted socks, perfect for winter.";
          imageUrl = "https://as1.ftcdn.net/v2/jpg/03/28/30/07/1000_F_328300719_6leGR635Q0gyjC8AhGnxKhj7n8AEdgjx.jpg";
          stockQuantity = 30;
          additionalDetails = "Various sizes and colors available";
          isAvailable = true;
        },
        {
          id = "4";
          name = "SayHi Earphones";
          manufacturer = "SayHi";
          category = "Earphones";
          price = 20;
          description = "High-quality earphones with noise-cancellation.";
          imageUrl = "https://as1.ftcdn.net/v2/jpg/05/53/36/78/1000_F_553367899_6mKMCj2WikvlfG3CkPJ86by9elPjtVpS.jpg";
          stockQuantity = 75;
          additionalDetails = "3.5mm Jack, In-ear design";
          isAvailable = true;
        },
      ];

      for (product in sampleProducts.values()) {
        products.add(product.id, product);
      };
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Product Management
  public query ({ caller }) func getProduct(productId : Text) : async Product {
    // Public read access - no authorization required
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    // Public read access - no authorization required
    products.values().toArray().sort();
  };

  public shared ({ caller }) func createProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    products.add(product.id, product);
  };

  public shared ({ caller }) func updateProduct(productId : Text, updatedProduct : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    if (not products.containsKey(productId)) {
      Runtime.trap("Product not found");
    };
    products.add(productId, updatedProduct);
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    products.remove(productId);
  };

  // Order Management
  public shared ({ caller }) func placeOrder(customerName : Text, phone : Text, address : Text, quantity : Nat, productId : Text, specialDescription : Text) : async () {
    // Allow guests to place orders (e-commerce public function)
    // No authorization check - this is intentionally public for customer orders

    // Validate input
    if (customerName.size() == 0) {
      Runtime.trap("Customer name is required");
    };
    if (phone.size() == 0) {
      Runtime.trap("Phone number is required");
    };
    if (address.size() == 0) {
      Runtime.trap("Address is required");
    };
    if (quantity == 0) {
      Runtime.trap("Quantity must be greater than 0");
    };

    let orderId = "order-" # productId; // Fallback to using productId as part of orderId
    let order : Order = {
      id = orderId;
      customerName;
      phone;
      address;
      quantity;
      productId;
      specialDescription;
      status = #pending;
      timestamp = Time.now();
      courierName = null;
      courierTrackingNumber = null;
    };
    orders.add(orderId, order);
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    orders.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Text, newStatus : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = {
          id = order.id;
          customerName = order.customerName;
          phone = order.phone;
          address = order.address;
          quantity = order.quantity;
          productId = order.productId;
          specialDescription = order.specialDescription;
          status = newStatus;
          timestamp = order.timestamp;
          courierName = order.courierName;
          courierTrackingNumber = order.courierTrackingNumber;
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public shared ({ caller }) func updateOrderCourierInfo(orderId : Text, courierName : Text, courierTrackingNumber : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = {
          id = order.id;
          customerName = order.customerName;
          phone = order.phone;
          address = order.address;
          quantity = order.quantity;
          productId = order.productId;
          specialDescription = order.specialDescription;
          status = order.status;
          timestamp = order.timestamp;
          courierName = ?courierName;
          courierTrackingNumber = ?courierTrackingNumber;
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getOrdersByStatus(status : OrderStatus) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let filteredOrders = List.empty<Order>();
    for (order in orders.values()) {
      if (order.status == status) {
        filteredOrders.add(order);
      };
    };

    filteredOrders.toArray();
  };

  public query ({ caller }) func getTopSellingProducts(limit : Nat) : async [ProductSales] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let productSalesMap = Map.empty<Text, (Text, Nat)>();

    for (order in orders.values()) {
      let (currentName, currentQuantity) = switch (productSalesMap.get(order.productId)) {
        case (?data) { data };
        case (null) { ("", 0) };
      };

      let productName = switch (products.get(order.productId)) {
        case (?product) { product.name };
        case (null) { currentName };
      };

      let updatedQuantity = currentQuantity + order.quantity;
      productSalesMap.add(order.productId, (productName, updatedQuantity));
    };

    let salesList = List.empty<ProductSales>();

    for ((productId, (productName, totalQuantity)) in productSalesMap.entries()) {
      salesList.add({
        productId;
        productName;
        totalQuantity;
      });
    };

    let salesArray = salesList.toArray();
    let sortedSales = salesArray.sort(
      func(a, b) {
        Nat.compare(b.totalQuantity, a.totalQuantity);
      }
    );

    let resultLength = Nat.min(limit, sortedSales.size());
    sortedSales.sliceToArray(0, resultLength);
  };

  public query ({ caller }) func getRecentOrders(limit : Nat) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let allOrders = orders.values().toArray();

    let sortedOrders = allOrders.sort(
      func(a, b) {
        Int.compare(b.timestamp, a.timestamp);
      }
    );

    let resultLength = Nat.min(limit, sortedOrders.size());
    sortedOrders.sliceToArray(0, resultLength);
  };

  // Inquiry Management
  public shared ({ caller }) func submitInquiry(name : Text, phone : Text, message : Text) : async () {
    // Allow guests to submit inquiries (public customer support function)
    // No authorization check - this is intentionally public for customer inquiries

    // Validate input
    if (name.size() == 0) {
      Runtime.trap("Name is required");
    };
    if (phone.size() == 0) {
      Runtime.trap("Phone number is required");
    };
    if (message.size() == 0) {
      Runtime.trap("Message is required");
    };

    let inquiryId = "inquiry-" # name # phone; // Fallback to using name and phone as part of inquiryId
    let inquiry : Inquiry = {
      name;
      phone;
      message;
      timestamp = Time.now();
    };
    inquiries.add(inquiryId, inquiry);
  };

  public query ({ caller }) func getAllInquiries() : async [Inquiry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    inquiries.values().toArray();
  };

  // Analytics Functions (Admin Only)
  public query ({ caller }) func getTotalRevenue() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    var totalRevenue : Nat = 0;
    for (order in orders.values()) {
      switch (order.status) {
        case (#confirmed or #delivered) {
          switch (products.get(order.productId)) {
            case (?product) {
              totalRevenue += product.price * order.quantity;
            };
            case (null) {};
          };
        };
        case (_) {};
      };
    };
    totalRevenue;
  };

  public query ({ caller }) func getOrdersCountByStatus() : async [(Text, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    var pendingCount : Nat = 0;
    var confirmedCount : Nat = 0;
    var shippedCount : Nat = 0;
    var outForDeliveryCount : Nat = 0;
    var deliveredCount : Nat = 0;
    var cancelledCount : Nat = 0;

    for (order in orders.values()) {
      switch (order.status) {
        case (#pending) { pendingCount += 1 };
        case (#confirmed) { confirmedCount += 1 };
        case (#shipped) { shippedCount += 1 };
        case (#out_for_delivery) { outForDeliveryCount += 1 };
        case (#delivered) { deliveredCount += 1 };
        case (#cancelled) { cancelledCount += 1 };
      };
    };

    [
      ("pending", pendingCount),
      ("confirmed", confirmedCount),
      ("shipped", shippedCount),
      ("out_for_delivery", outForDeliveryCount),
      ("delivered", deliveredCount),
      ("cancelled", cancelledCount),
    ];
  };

  public query ({ caller }) func getMonthlySalesSummary() : async [MonthlySales] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let currentTime = Time.now();
    let nanosPerSecond : Int = 1_000_000_000;
    let secondsPerDay : Int = 86_400;
    let daysPerYear : Int = 365;

    // Calculate approximate current year (simplified)
    let currentYear : Nat = 2024;

    var monthlySales = Map.empty<Nat, (Nat, Nat)>();

    for (order in orders.values()) {
      let orderTimeSeconds = order.timestamp / nanosPerSecond;
      let dayOfYear = (orderTimeSeconds / secondsPerDay) % daysPerYear;
      let dayOfYearNat = dayOfYear.toNat();
      let month = (dayOfYearNat / 30) + 1;
      let (currentCount, currentRevenue) = switch (monthlySales.get(month)) {
        case (?data) { data };
        case (null) { (0, 0) };
      };

      let orderRevenue = switch (order.status) {
        case (#confirmed or #delivered) {
          switch (products.get(order.productId)) {
            case (?product) { product.price * order.quantity };
            case (null) { 0 };
          };
        };
        case (_) { 0 };
      };

      monthlySales.add(month, (currentCount + 1, currentRevenue + orderRevenue));
    };

    let result = Array.tabulate(
      12,
      func(i : Nat) : MonthlySales {
        let month = i + 1;
        let (orderCount, revenue) = switch (monthlySales.get(month)) {
          case (?data) { data };
          case (null) { (0, 0) };
        };
        {
          month = month;
          year = currentYear;
          orderCount = orderCount;
          revenue = revenue;
        };
      },
    );

    result;
  };

  public query ({ caller }) func getTotalOrdersCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    orders.size();
  };
};

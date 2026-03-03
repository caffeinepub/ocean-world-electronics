import Map "mo:core/Map";
import Text "mo:core/Text";

module {
  // Old types (Order without courier fields and limited OrderStatus)
  type OldOrderStatus = {
    #pending;
    #confirmed;
    #delivered;
    #cancelled;
  };

  type OldOrder = {
    id : Text;
    customerName : Text;
    phone : Text;
    address : Text;
    quantity : Nat;
    productId : Text;
    specialDescription : Text;
    status : OldOrderStatus;
    timestamp : Int;
  };

  type OldActor = {
    orders : Map.Map<Text, OldOrder>;
  };

  // New types (Order with courier fields and extended OrderStatus)
  type NewOrderStatus = {
    #pending;
    #confirmed;
    #shipped;
    #out_for_delivery;
    #delivered;
    #cancelled;
  };

  type NewOrder = {
    id : Text;
    customerName : Text;
    phone : Text;
    address : Text;
    quantity : Nat;
    productId : Text;
    specialDescription : Text;
    status : NewOrderStatus;
    timestamp : Int;
    courierName : ?Text;
    courierTrackingNumber : ?Text;
  };

  type NewActor = {
    orders : Map.Map<Text, NewOrder>;
  };

  // Migration function
  public func run(old : OldActor) : NewActor {
    let newOrders = old.orders.map<Text, OldOrder, NewOrder>(
      func(_id, oldOrder) {
        {
          oldOrder with
          status = migrateOrderStatus(oldOrder.status);
          courierName = null;
          courierTrackingNumber = null;
        };
      }
    );
    { orders = newOrders };
  };

  func migrateOrderStatus(oldStatus : OldOrderStatus) : NewOrderStatus {
    switch (oldStatus) {
      case (#pending) { #pending };
      case (#confirmed) { #confirmed };
      case (#delivered) { #delivered };
      case (#cancelled) { #cancelled };
    };
  };
};

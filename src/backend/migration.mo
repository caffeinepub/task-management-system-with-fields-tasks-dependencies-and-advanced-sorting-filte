import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time"; // Importing Time

module {
  // Original Field record type (without totalTaskDuration)
  type OldField = {
    id : Text;
    name : Text;
    createdBy : Principal;
    createdAt : Time.Time;
    avgUrgency : Nat;
    avgValue : Nat;
    avgInterest : Nat;
    avgInfluence : Nat;
    totalActiveTaskDuration : Nat;
    taskCount : Nat;
    totalTaskCount : Nat;
  };

  // Original Actor State
  type OldActor = {
    fields : Map.Map<Text, OldField>;
    // Other state fields remain unchanged
  };

  // Extended Field record type (with totalTaskDuration)
  type NewField = {
    id : Text;
    name : Text;
    createdBy : Principal;
    createdAt : Time.Time;
    avgUrgency : Nat;
    avgValue : Nat;
    avgInterest : Nat;
    avgInfluence : Nat;
    totalActiveTaskDuration : Nat;
    totalTaskDuration : Nat;
    taskCount : Nat;
    totalTaskCount : Nat;
  };

  // New Actor State
  type NewActor = {
    fields : Map.Map<Text, NewField>;
    // Other state fields remain unchanged
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    // Transform existing fields to include totalTaskDuration, preserving other state
    let newFields = old.fields.map<Text, OldField, NewField>(
      func(_id, oldField) {
        { oldField with totalTaskDuration = 0 }; // Initialize totalTaskDuration to 0
      }
    );
    { fields = newFields };
  };
};

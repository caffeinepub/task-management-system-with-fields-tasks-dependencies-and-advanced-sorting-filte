import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type DurationUnit = {
    #minutes;
    #hours;
    #days;
  };

  type OldField = {
    id : Text;
    name : Text;
    icon : Text;
    color : Text;
    createdBy : Principal.Principal;
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

  type Task = {
    id : Text;
    fieldId : Text;
    name : Text;
    urgency : Nat;
    value : Nat;
    interest : Nat;
    influence : Nat;
    duration : Nat;
    durationUnit : DurationUnit;
    dependencies : [Text];
    createdBy : Principal.Principal;
    createdAt : Time.Time;
    completed : Bool;
  };

  type OldActor = {
    fields : Map.Map<Text, OldField>;
    tasks : Map.Map<Text, Task>;
  };

  type NewField = {
    id : Text;
    name : Text;
    icon : Text;
    color : Text;
    backgroundColor : Text;
    createdBy : Principal.Principal;
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

  type NewActor = {
    fields : Map.Map<Text, NewField>;
    tasks : Map.Map<Text, Task>;
  };

  public func run(old : OldActor) : NewActor {
    let newFields = old.fields.map<Text, OldField, NewField>(
      func(_id, oldField) {
        { oldField with backgroundColor = "#ffffff" }; // Default to white background
      }
    );
    { old with fields = newFields };
  };
};

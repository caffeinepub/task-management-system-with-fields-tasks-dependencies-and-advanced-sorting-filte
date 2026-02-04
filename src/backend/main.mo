import Array "mo:core/Array";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Int "mo:core/Int";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  public type FieldId = Text;
  public type TaskId = Text;

  public type UserProfile = {
    name : Text;
  };

  public type DurationUnit = {
    #minutes;
    #hours;
    #days;
  };

  public type Field = {
    id : FieldId;
    name : Text;
    createdBy : Principal;
    createdAt : Time.Time;
    avgUrgency : Nat;
    avgValue : Nat;
    avgInterest : Nat;
    avgInfluence : Nat;
    totalActiveTaskDuration : Nat; // Sum of active (uncompleted) tasks in minutes
    taskCount : Nat; // Total number of active (uncompleted) tasks
    totalTaskCount : Nat; // Total number of all tasks (active + completed)
  };

  public type Task = {
    id : TaskId;
    fieldId : FieldId;
    name : Text;
    urgency : Nat;
    value : Nat;
    interest : Nat;
    influence : Nat;
    duration : Nat; // Duration always kept in minutes
    durationUnit : DurationUnit; // Store user's preferred unit for display purposes
    dependencies : [TaskId];
    completed : Bool;
    createdBy : Principal;
    createdAt : Time.Time;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();
  let fields = Map.empty<FieldId, Field>();
  var tasks = Map.empty<TaskId, Task>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can have persistent profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
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

  public shared ({ caller }) func createField(name : Text) : async FieldId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create fields");
    };

    let fieldId = name # "_" # caller.toText() # "_" # Time.now().toText();
    let field : Field = {
      id = fieldId;
      name;
      createdBy = caller;
      createdAt = Time.now();
      avgUrgency = 0;
      avgValue = 0;
      avgInterest = 0;
      avgInfluence = 0;
      totalActiveTaskDuration = 0;
      taskCount = 0;
      totalTaskCount = 0;
    };

    fields.add(fieldId, field);
    fieldId;
  };

  public shared ({ caller }) func updateField(
    fieldId : FieldId,
    name : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update fields");
    };

    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        if (field.createdBy != caller) {
          Runtime.trap("Unauthorized: Can only update your own fields");
        };

        let updatedField : Field = {
          id = field.id;
          name;
          createdBy = field.createdBy;
          createdAt = field.createdAt;
          avgUrgency = field.avgUrgency;
          avgValue = field.avgValue;
          avgInterest = field.avgInterest;
          avgInfluence = field.avgInfluence;
          totalActiveTaskDuration = field.totalActiveTaskDuration;
          taskCount = field.taskCount;
          totalTaskCount = field.totalTaskCount;
        };
        fields.add(fieldId, updatedField);
      };
    };
  };

  func convertToMinutes(duration : Nat, unit : DurationUnit) : Nat {
    switch (unit) {
      case (#minutes) { duration };
      case (#hours) { duration * 60 };
      case (#days) { duration * 1440 };
    };
  };

  public shared ({ caller }) func createTask(
    fieldId : FieldId,
    name : Text,
    urgency : Nat,
    value : Nat,
    interest : Nat,
    influence : Nat,
    duration : Nat,
    durationUnit : DurationUnit,
    dependencies : [TaskId],
  ) : async TaskId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tasks");
    };

    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        if (field.createdBy != caller) {
          Runtime.trap("Unauthorized: Can only create tasks in your own fields");
        };
      };
    };

    let taskId = name # "_" # caller.toText() # "_" # Time.now().toText();
    let durationInMinutes = convertToMinutes(duration, durationUnit);

    let task : Task = {
      id = taskId;
      fieldId;
      name;
      urgency;
      value;
      interest;
      influence;
      duration = durationInMinutes;
      durationUnit;
      dependencies;
      completed = false;
      createdBy = caller;
      createdAt = Time.now();
    };

    tasks.add(taskId, task);

    recalculateFieldAverages(fieldId);

    taskId;
  };

  public shared ({ caller }) func updateTask(
    taskId : TaskId,
    name : Text,
    urgency : Nat,
    value : Nat,
    interest : Nat,
    influence : Nat,
    duration : Nat,
    durationUnit : DurationUnit,
    dependencies : [TaskId],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tasks");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.createdBy != caller) {
          Runtime.trap("Unauthorized: Can only update your own tasks");
        };

        let durationInMinutes = convertToMinutes(duration, durationUnit);

        let updatedTask : Task = {
          id = task.id;
          fieldId = task.fieldId;
          name;
          urgency;
          value;
          interest;
          influence;
          duration = durationInMinutes;
          durationUnit;
          dependencies;
          completed = task.completed;
          createdBy = task.createdBy;
          createdAt = task.createdAt;
        };
        tasks.add(taskId, updatedTask);

        recalculateFieldAverages(task.fieldId);
      };
    };
  };

  public shared ({ caller }) func moveTaskToField(taskId : TaskId, newFieldId : FieldId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can move tasks");
    };

    let (originalTask, oldFieldId) = switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.createdBy != caller) {
          Runtime.trap("Unauthorized: Can only move your own tasks");
        };
        (task, task.fieldId);
      };
    };

    switch (fields.get(newFieldId)) {
      case (null) { Runtime.trap("Target field not found") };
      case (?field) {
        if (field.createdBy != caller) {
          Runtime.trap("Unauthorized: Can only move tasks to your own fields");
        };
      };
    };

    let movedTask : Task = {
      id = originalTask.id;
      fieldId = newFieldId;
      name = originalTask.name;
      urgency = originalTask.urgency;
      value = originalTask.value;
      interest = originalTask.interest;
      influence = originalTask.influence;
      duration = originalTask.duration;
      durationUnit = originalTask.durationUnit;
      dependencies = originalTask.dependencies;
      completed = originalTask.completed;
      createdBy = originalTask.createdBy;
      createdAt = originalTask.createdAt;
    };

    tasks.add(taskId, movedTask);

    recalculateFieldAverages(oldFieldId);
    recalculateFieldAverages(newFieldId);
  };

  public shared ({ caller }) func markTaskCompleted(taskId : TaskId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark tasks as completed");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.createdBy != caller) {
          Runtime.trap("Unauthorized: Can only mark your own tasks as completed");
        };

        let updatedTask : Task = {
          id = task.id;
          fieldId = task.fieldId;
          name = task.name;
          urgency = task.urgency;
          value = task.value;
          interest = task.interest;
          influence = task.influence;
          duration = task.duration;
          durationUnit = task.durationUnit;
          dependencies = task.dependencies;
          completed = true;
          createdBy = task.createdBy;
          createdAt = task.createdAt;
        };
        tasks.add(taskId, updatedTask);

        recalculateFieldAverages(task.fieldId);
      };
    };
  };

  public shared ({ caller }) func undoTaskCompletion(taskId : TaskId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can undo task completion");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.createdBy != caller) {
          Runtime.trap("Unauthorized: Can only undo your own tasks");
        };

        let updatedTask : Task = {
          id = task.id;
          fieldId = task.fieldId;
          name = task.name;
          urgency = task.urgency;
          value = task.value;
          interest = task.interest;
          influence = task.influence;
          duration = task.duration;
          durationUnit = task.durationUnit;
          dependencies = task.dependencies;
          completed = false;
          createdBy = task.createdBy;
          createdAt = task.createdAt;
        };
        tasks.add(taskId, updatedTask);

        recalculateFieldAverages(task.fieldId);
      };
    };
  };

  public shared ({ caller }) func deleteTask(taskId : TaskId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tasks");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.createdBy != caller) {
          Runtime.trap("Unauthorized: Can only delete your own tasks");
        };

        tasks.remove(taskId);
        recalculateFieldAverages(task.fieldId);
      };
    };
  };

  func checkDeletableField(
    fieldId : FieldId,
    _actorType : Text,
    _userOwnershipMsg : Text,
    _singleFieldMsg : Text,
    _incompleteTasksMsg : Text,
  ) : () {
    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        let creatorCount = getDistinctCreators().size();

        if (creatorCount == 1) {
          Runtime.trap("Insufficient field creators exist in the system. At least two user must exist to maintain ownership of fields.");
        };

        if (Int.abs(getFieldsByCreator(field.createdBy).size()) == 1) {
          Runtime.trap("Insufficient user fields. At least two field must exist to maintain ownership.");
        };

        let remainingTasks = getTasksByFieldId(fieldId);
        let incompleteTasks = remainingTasks.filter(
          func(task) {
            not task.completed;
          }
        );

        if (incompleteTasks.size() > 0) {
          Runtime.trap("Before deleting this field, please resolve all tasks.");
        };
      };
    };
  };

  public shared ({ caller }) func deleteField(fieldId : FieldId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete fields");
    };

    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        if (field.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own fields");
        };
      };
    };

    checkDeletableField(
      fieldId,
      "user",
      "you must maintain ownership",
      "As a user, you must maintain at least one field.",
      "Please resolve all incomplete tasks before deleting this field.",
    );

    let filteredTasks = tasks.entries().foldLeft(
      Map.empty<TaskId, Task>(),
      func(acc, (id, task)) {
        if (task.fieldId != fieldId) {
          acc.add(id, task);
        };
        acc;
      },
    );

    tasks := filteredTasks;

    for ((taskId, task) in tasks.entries()) {
      let filteredDependencies = task.dependencies.filter(
        func(depId) {
          switch (tasks.get(depId)) {
            case (null) { false };
            case (?depTask) {
              depTask.fieldId != fieldId;
            };
          };
        }
      );
      tasks.add(taskId, { task with dependencies = filteredDependencies });
    };
    fields.remove(fieldId);
  };

  public query ({ caller }) func getAllFields() : async [Field] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access fields");
    };

    let userFields = if (AccessControl.isAdmin(accessControlState, caller)) {
      fields.values().toArray();
    } else {
      fields.values().toArray().filter(
        func(field) {
          field.createdBy == caller;
        }
      );
    };
    userFields;
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access tasks");
    };

    let filteredTasks = if (AccessControl.isAdmin(accessControlState, caller)) {
      tasks.values().toArray().filter(
        func(task) {
          not task.completed;
        }
      );
    } else {
      tasks.values().toArray().filter(
        func(task) {
          task.createdBy == caller and not task.completed;
        }
      );
    };

    filteredTasks;
  };

  public query ({ caller }) func getTasksByField(fieldId : FieldId) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access tasks");
    };

    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        if (field.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access tasks in your own fields");
        };
      };
    };

    let filteredTasks = tasks.values().toArray().filter(
      func(task) {
        task.fieldId == fieldId and not task.completed
      }
    );
    filteredTasks;
  };

  public query ({ caller }) func searchTasks(fieldId : FieldId, searchTerm : Text) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search tasks");
    };

    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        if (field.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only search tasks in your own fields");
        };
      };
    };

    let filteredTasks = tasks.values().toArray().filter(
      func(task) {
        task.fieldId == fieldId and not task.completed and task.name.contains(#text searchTerm)
      }
    );
    filteredTasks;
  };

  func filterTaskByAttributeRange(task : Task, attribute : Text, minValue : Nat, maxValue : Nat) : Bool {
    switch (attribute) {
      case ("urgency") { task.urgency >= minValue and task.urgency <= maxValue };
      case ("value") { task.value >= minValue and task.value <= maxValue };
      case ("interest") { task.interest >= minValue and task.interest <= maxValue };
      case ("influence") { task.influence >= minValue and task.influence <= maxValue };
      case ("duration") { task.duration >= minValue and task.duration <= maxValue };
      case (_) { false };
    };
  };

  public query ({ caller }) func filterTasksByAttribute(
    fieldId : FieldId,
    attribute : Text,
    minValue : Nat,
    maxValue : Nat,
  ) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can filter tasks");
    };

    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        if (field.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only filter tasks in your own fields");
        };
      };
    };

    let filteredTasks = tasks.values().toArray().filter(
      func(task) {
        task.fieldId == fieldId and not task.completed and filterTaskByAttributeRange(task, attribute, minValue, maxValue);
      }
    );
    filteredTasks;
  };

  func recalculateFieldAverages(fieldId : FieldId) {
    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        let allTasks = tasks.values().toArray().filter(
          func(task) {
            task.fieldId == fieldId;
          }
        );

        let uncompletedTasks = allTasks.filter(
          func(task) {
            not task.completed;
          }
        );

        let taskCount = uncompletedTasks.size();
        let totalTaskCount = allTasks.size();

        let (totalUrgency, totalValue, totalInterest, totalInfluence, totalActiveTaskDuration) = uncompletedTasks.foldRight(
          (0, 0, 0, 0, 0),
          func(task, acc) {
            (acc.0 + task.urgency, acc.1 + task.value, acc.2 + task.interest, acc.3 + task.influence, acc.4 + task.duration);
          },
        );

        let avgUrgency = if (taskCount > 0) { totalUrgency / taskCount } else { 0 };
        let avgValue = if (taskCount > 0) { totalValue / taskCount } else { 0 };
        let avgInterest = if (taskCount > 0) { totalInterest / taskCount } else { 0 };
        let avgInfluence = if (taskCount > 0) { totalInfluence / taskCount } else { 0 };

        let updatedField : Field = {
          id = field.id;
          name = field.name;
          createdBy = field.createdBy;
          createdAt = field.createdAt;
          avgUrgency;
          avgValue;
          avgInterest;
          avgInfluence;
          totalActiveTaskDuration;
          taskCount;
          totalTaskCount;
        };

        fields.add(fieldId, updatedField);
      };
    };
  };

  func getDistinctCreators() : [Principal] {
    let creatorSet = Map.empty<Principal, Bool>();
    for ((_, field) in fields.entries()) {
      let creatorExists = switch (creatorSet.get(field.createdBy)) {
        case (null) { false };
        case (?_) { true };
      };
      if (not creatorExists) {
        creatorSet.add(field.createdBy, true);
      };
    };
    creatorSet.keys().toArray();
  };

  func getFieldsByCreator(creator : Principal) : [Field] {
    fields.values().toArray().filter(
      func(field) {
        field.createdBy == creator;
      }
    );
  };

  func getTasksByFieldId(fieldId : FieldId) : [Task] {
    tasks.values().toArray().filter(
      func(task) {
        task.fieldId == fieldId;
      }
    );
  };
};

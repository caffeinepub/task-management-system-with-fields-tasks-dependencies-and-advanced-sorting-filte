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
    icon : Text;
    color : Text;
    backgroundColor : Text;
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

  public type Task = {
    id : TaskId;
    fieldId : FieldId;
    name : Text;
    urgency : Nat;
    value : Nat;
    interest : Nat;
    influence : Nat;
    duration : Nat;
    durationUnit : DurationUnit;
    dependencies : [TaskId];
    createdBy : Principal;
    createdAt : Time.Time;
    completed : Bool;
  };

  public type ExportPayload = {
    fields : [Field];
    tasks : [Task];
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let fields = Map.empty<FieldId, Field>();
  var tasks = Map.empty<TaskId, Task>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  func ensureUserRole(caller : Principal) {
    if (caller.isAnonymous()) { return };
    let currentRole = AccessControl.getUserRole(accessControlState, caller);
    switch (currentRole) {
      case (#guest) {
        AccessControl.assignRole(accessControlState, caller, caller, #user);
      };
      case (_) {};
    };
  };

  func requireUserPermission(caller : Principal) {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Only users can access");
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    ensureUserRole(caller);
    if (caller.isAnonymous()) { return null };
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Users only");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    ensureUserRole(caller);
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireUserPermission(caller);
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createField(name : Text, icon : Text, color : Text, backgroundColor : Text) : async FieldId {
    requireUserPermission(caller);
    let fieldId = name # "_" # caller.toText() # "_" # Time.now().toText();
    let field : Field = {
      id = fieldId;
      name;
      icon;
      color;
      backgroundColor;
      createdBy = caller;
      createdAt = Time.now();
      avgUrgency = 0;
      avgValue = 0;
      avgInterest = 0;
      avgInfluence = 0;
      totalActiveTaskDuration = 0;
      totalTaskDuration = 0;
      taskCount = 0;
      totalTaskCount = 0;
    };
    fields.add(fieldId, field);
    fieldId;
  };

  public shared ({ caller }) func updateField(fieldId : FieldId, name : Text, icon : Text, color : Text, backgroundColor : Text) : async () {
    requireUserPermission(caller);
    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        if (field.createdBy != caller) {
          Runtime.trap("Only own fields can be updated");
        };
        let updatedField : Field = {
          id = field.id;
          name;
          icon;
          color;
          backgroundColor;
          createdBy = field.createdBy;
          createdAt = field.createdAt;
          avgUrgency = field.avgUrgency;
          avgValue = field.avgValue;
          avgInterest = field.avgInterest;
          avgInfluence = field.avgInfluence;
          totalActiveTaskDuration = field.totalActiveTaskDuration;
          totalTaskDuration = field.totalTaskDuration;
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
    requireUserPermission(caller);
    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        if (field.createdBy != caller) {
          Runtime.trap("Only own tasks can be created");
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
      createdBy = caller;
      createdAt = Time.now();
      completed = false;
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
    requireUserPermission(caller);
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.createdBy != caller) {
          Runtime.trap("Can only update own tasks");
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
          createdBy = task.createdBy;
          createdAt = task.createdAt;
          completed = task.completed;
        };
        tasks.add(taskId, updatedTask);
        recalculateFieldAverages(task.fieldId);
      };
    };
  };

  public shared ({ caller }) func moveTaskToField(taskId : TaskId, newFieldId : FieldId) : async () {
    requireUserPermission(caller);
    let (originalTask, oldFieldId) = switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.createdBy != caller) {
          Runtime.trap("Move own tasks only");
        };
        (task, task.fieldId);
      };
    };
    switch (fields.get(newFieldId)) {
      case (null) { Runtime.trap("Target field not found") };
      case (?field) {
        if (field.createdBy != caller) {
          Runtime.trap("Can only move tasks to own fields");
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
      createdBy = originalTask.createdBy;
      createdAt = originalTask.createdAt;
      completed = originalTask.completed;
    };
    tasks.add(taskId, movedTask);
    recalculateFieldAverages(oldFieldId);
    recalculateFieldAverages(newFieldId);
  };

  public shared ({ caller }) func markTaskCompleted(taskId : TaskId) : async () {
    requireUserPermission(caller);
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.createdBy != caller) {
          Runtime.trap("Completion: own tasks only");
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
          createdBy = task.createdBy;
          createdAt = task.createdAt;
          completed = true;
        };
        tasks.add(taskId, updatedTask);
        recalculateFieldAverages(task.fieldId);
      };
    };
  };

  public shared ({ caller }) func undoTaskCompletion(taskId : TaskId) : async () {
    requireUserPermission(caller);
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.createdBy != caller) {
          Runtime.trap("Undo: own tasks only");
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
          createdBy = task.createdBy;
          createdAt = task.createdAt;
          completed = false;
        };
        tasks.add(taskId, updatedTask);
        recalculateFieldAverages(task.fieldId);
      };
    };
  };

  public shared ({ caller }) func deleteTask(taskId : TaskId) : async () {
    requireUserPermission(caller);
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.createdBy != caller) {
          Runtime.trap("Delete: own tasks only");
        };
        tasks.remove(taskId);
        recalculateFieldAverages(task.fieldId);
      };
    };
  };

  public shared ({ caller }) func deleteField(fieldId : FieldId) : async () {
    requireUserPermission(caller);
    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        if (field.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Delete: own fields only (or admin)");
        };
      };
    };

    // Remove only tasks linked to the deleted field
    let filteredTasks = tasks.entries().foldLeft(
      Map.empty<TaskId, Task>(),
      func(acc, (id, task)) {
        if (task.fieldId != fieldId) { acc.add(id, task) };
        acc;
      },
    );
    tasks := filteredTasks;
    // Remove dependencies that reference deleted tasks
    for ((taskId, task) in tasks.entries()) {
      let filteredDependencies = task.dependencies.filter(func(depId) {
        switch (tasks.get(depId)) {
          case (null) { false };
          case (?depTask) { depTask.fieldId != fieldId };
        };
      });
      tasks.add(taskId, { task with dependencies = filteredDependencies });
    };
    fields.remove(fieldId);
  };

  public query ({ caller }) func getAllFields() : async [Field] {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Only users can access fields");
    };
    if (AccessControl.isAdmin(accessControlState, caller)) {
      fields.values().toArray();
    } else {
      fields.values().toArray().filter(func(field) { field.createdBy == caller });
    };
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Users only");
    };
    if (AccessControl.isAdmin(accessControlState, caller)) {
      tasks.values().toArray().filter(func(task) { not task.completed });
    } else {
      tasks.values().toArray().filter(func(task) {
        task.createdBy == caller and not task.completed
      });
    };
  };

  public query ({ caller }) func getTasksByField(fieldId : FieldId) : async [Task] {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Users only");
    };
    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        if (field.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Task access: own fields only (or admin)");
        };
      };
    };
    tasks.values().toArray().filter(func(task) {
      task.fieldId == fieldId and not task.completed
    });
  };

  public query ({ caller }) func searchTasks(fieldId : FieldId, searchTerm : Text) : async [Task] {
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Users can search only");
    };
    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        if (field.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Own field search only");
        };
      };
    };
    tasks.values().toArray().filter(func(task) {
      task.fieldId == fieldId and not task.completed and task.name.contains(#text searchTerm)
    });
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
    ensureUserRole(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Restricted to users");
    };
    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        if (field.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Own fields only (or admin)");
        };
      };
    };
    tasks.values().toArray().filter(func(task) {
      task.fieldId == fieldId and not task.completed and filterTaskByAttributeRange(task, attribute, minValue, maxValue)
    });
  };

  func recalculateFieldAverages(fieldId : FieldId) {
    switch (fields.get(fieldId)) {
      case (null) { Runtime.trap("Field not found") };
      case (?field) {
        let allTasks = tasks.values().toArray().filter(func(task) {
          task.fieldId == fieldId
        });
        let uncompletedTasks = allTasks.filter(func(task) {
          not task.completed
        });
        let taskCount = uncompletedTasks.size();
        let totalTaskCount = allTasks.size();
        let (totalUrgency, totalValue, totalInterest, totalInfluence, totalActiveTaskDuration, totalTaskDuration) = allTasks.foldRight(
          (0, 0, 0, 0, 0, 0),
          func(task, acc) {
            let activeContribution = if (not task.completed) { task.duration } else { 0 };
            (
              acc.0 + (if (not task.completed) { task.urgency } else { 0 }),
              acc.1 + (if (not task.completed) { task.value } else { 0 }),
              acc.2 + (if (not task.completed) { task.interest } else { 0 }),
              acc.3 + (if (not task.completed) { task.influence } else { 0 }),
              acc.4 + activeContribution,
              acc.5 + task.duration
            );
          },
        );
        let avgUrgency = if (taskCount > 0) { totalUrgency / taskCount } else { 0 };
        let avgValue = if (taskCount > 0) { totalValue / taskCount } else { 0 };
        let avgInterest = if (taskCount > 0) { totalInterest / taskCount } else { 0 };
        let avgInfluence = if (taskCount > 0) { totalInfluence / taskCount } else { 0 };
        let updatedField : Field = {
          id = field.id;
          name = field.name;
          icon = field.icon;
          color = field.color;
          backgroundColor = field.backgroundColor;
          createdBy = field.createdBy;
          createdAt = field.createdAt;
          avgUrgency;
          avgValue;
          avgInterest;
          avgInfluence;
          totalActiveTaskDuration;
          totalTaskDuration;
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
      if (not creatorExists) { creatorSet.add(field.createdBy, true) };
    };
    creatorSet.keys().toArray();
  };

  func getFieldsByCreator(creator : Principal) : [Field] {
    fields.values().toArray().filter(func(field) { field.createdBy == creator });
  };

  func getTasksByFieldId(fieldId : FieldId) : [Task] {
    tasks.values().toArray().filter(func(task) { task.fieldId == fieldId });
  };

  public query ({ caller }) func exportUserData() : async ExportPayload {
    requireUserPermission(caller);
    let userFields = fields.values().toArray().filter(func(field) { field.createdBy == caller });
    let userTasks = tasks.values().toArray().filter(func(task) { task.createdBy == caller });
    {
      fields = userFields;
      tasks = userTasks;
    };
  };

  public shared ({ caller }) func importUserData(payload : ExportPayload) : async () {
    requireUserPermission(caller);
    // Remove only the caller's existing fields and tasks
    let filteredFields = fields.entries().foldLeft(
      Map.empty<FieldId, Field>(),
      func(acc, (id, field)) {
        if (field.createdBy != caller) { acc.add(id, field) };
        acc;
      },
    );
    
    let filteredTasks = tasks.entries().foldLeft(
      Map.empty<TaskId, Task>(),
      func(acc, (id, task)) {
        if (task.createdBy != caller) { acc.add(id, task) };
        acc;
      },
    );

    fields.clear();
    for ((id, field) in filteredFields.entries()) {
      fields.add(id, field);
    };

    tasks.clear();
    for ((id, task) in filteredTasks.entries()) {
      tasks.add(id, task);
    };

    // Add imported fields and tasks (all should belong to caller)
    for (field in payload.fields.values()) {
      fields.add(field.id, field);
    };

    for (task in payload.tasks.values()) {
      tasks.add(task.id, task);
    };
  };
};



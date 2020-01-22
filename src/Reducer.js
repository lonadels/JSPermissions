const reducer = (state = { groups: {}, users: {} }, action) => {
	let group;
	switch (action.type) {
		case "ADD_GROUP":
			let groupKeys = Object.keys(state.groups);
			let groupID = Math.pow(2, groupKeys.length);
			return {
				...state,
				groups: {
					...state.groups,
					[groupID]: {
						name: action.name,
						permissions: [],
						id: groupID
					}
				}
			}
		case "ADD_PERMISSION":
			group = state.groups[action.groupID];
			return {
				...state,
				groups: {
					...state.groups, [action.groupID]:
					{
						...group,
						permissions: [...group.permissions, action.permission]
					}
				}
			}

		case "SET_PERMISSIONS":
			group = state.groups[action.groupID];
			return {
				...state,
				groups: {
					...state.groups, [action.groupID]:
					{
						...group,
						permissions: action.permissions
					}
				}
			}

		case "REMOVE_GROUP":
			/** @TODO */ 
			break;

		default: return state;
	}
}

export default reducer;
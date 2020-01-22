import React, { Component } from 'react';

//import connect from '@vkontakte/vk-connect';
import '@vkontakte/vkui/dist/vkui.css';

import { ConfigProvider, Root, View, Panel, ScreenSpinner, Div, Group, List, Cell, Input, Placeholder, Avatar } from '@vkontakte/vkui';
import { PanelHeader, Button } from '@vkontakte/vkui';

import connect from '@vkontakte/vkui-connect-mock';
import { createStore } from 'redux';

import Icon56UsersOutline from '@vkontakte/icons/dist/56/users_outline';
import Icon28UsersOutline from '@vkontakte/icons/dist/28/users_outline';

const reducer = (state = { groups: {}, users: {} }, action) => {
	switch (action.type) {
		case "ADD_GROUP":
			let groupKeys = Object.keys(state.groups);
			return {
				...state,
				groups: {
					...state.groups,
					[2 ^ groupKeys.length]: {
						name: action.name,
						permissions: []
					}
				}
			}
		case "ADD_PERMISSION":
			let group = state.groups[action.groupID];
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
		case "ADD_USER":
			return { ...state, users: [...state.users, action.user] }
		default: return state;
	}
}

var store = createStore(reducer);

class User {
	constructor(name, privLevel) {
		this._name = name;
		this._privLevel = privLevel;
	}

	hasPermission(permission) {
		let permissions = [];

		for (let [group, bin] in Object.entries(store.getState().groups))
			if (bin & this.privLevel)
				permissions = [...permissions, ...store.getState().permissions[group]]

		return permissions.indexOf(permission) !== -1 && permissions.indexOf("-" + permission) === -1;
	}
}

export default class App extends Component {

	constructor() {
		super();

		this.state = {
			user: null,
			popout: <ScreenSpinner size='large' />,
			valid: "default",
			groups: []
		}

		this.fetchData();

		this.addUser = this.addUser.bind(this);
		this.addGroup = this.addGroup.bind(this);
		this.addPermission = this.addPermission.bind(this);

		this.onChange = this.onChange.bind(this);

		store.subscribe(() => {
			this.setState({ groups: Object.values(store.getState().groups) })
		})
	}

	async fetchData() {
		const user = await connect.send('VKWebAppGetUserInfo');
		this.setState({ user, popout: null });
	}

	addUser() {
		//let user = new User("lonadels", );
		//user.
		//store.dispatch({type: "ADD_USER", user });
	}

	addGroup() {
		let name = this.state.groupName;
		this.setState({valid: name.length > 0 ? "default" : "error"});
		if(name.length < 1) return
		store.dispatch({ type: "ADD_GROUP", name });
	}

	addPermission() {
		//let user = new User("lonadels", );
		//user.
		//store.dispatch({type: "ADD_USER", user });
	}

	componentDidUpdate() {
		connect.subscribe(({ detail: { type, data } }) => {
			if (type === 'VKWebAppUpdateConfig') {
				const schemeAttribute = document.createAttribute('scheme');
				schemeAttribute.value = data.scheme ? data.scheme : 'client_light';
				document.body.attributes.setNamedItem(schemeAttribute);
			}
		});
	}

	getPermissions(group) {
		return group.permissions.join(", ") || "нет прав";
	}

	onChange(e) {
		const { name, value } = e.currentTarget;
		this.setState({ [name]: value, valid: "default" });
	}

	render() {

		return (
			<ConfigProvider>
				<Root>
					<View popout={this.state.popout}>
						<Panel>
							<PanelHeader>JSPermission</PanelHeader>
							<Group title="Группы">
								
									<List>
										{ this.state.groups.length > 0 ? this.state.groups.map((group, i) => <Cell expandable onClick={() => null} before={<Avatar><Icon28UsersOutline /></Avatar>} description={"Права: " + this.getPermissions(group)} key={i}>{group.name}</Cell>) : <Placeholder icon={<Icon56UsersOutline />}>Нет групп</Placeholder>}
									</List>
									<Div style={{display: "flex"}}>
										<Input status={this.state.valid} onChange={this.onChange} name="groupName" type="text" placeholder="Название группы" />
										<Button style={{marginLeft: "10px"}} onClick={this.addGroup}>Добавить</Button>
									</Div>
								
							</Group>

						</Panel>
					</View>
				</Root>
			</ConfigProvider>
		);
	}
}


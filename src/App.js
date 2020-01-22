import React, { Component } from 'react';

//import connect from '@vkontakte/vk-connect';
import '@vkontakte/vkui/dist/vkui.css';

import { ConfigProvider, Root, View, Panel, ScreenSpinner, Div, Group, List, Cell, Input, Placeholder, Avatar, PanelHeaderClose, PanelHeaderSubmit, FormLayout, FormLayoutGroup, Footer, Select, Switch, CellButton, Alert } from '@vkontakte/vkui';
import { PanelHeader, Button } from '@vkontakte/vkui';

import connect from '@vkontakte/vkui-connect-mock';
import { createStore } from 'redux';

import Icon56UsersOutline from '@vkontakte/icons/dist/56/users_outline';
import Icon56LockOutline from '@vkontakte/icons/dist/56/lock_outline';

import Icon28UsersOutline from '@vkontakte/icons/dist/28/users_outline';

import Icon24Write from '@vkontakte/icons/dist/24/write';
import Icon24MoreHorizontal from '@vkontakte/icons/dist/24/more_horizontal';
import { OS, platform } from '@vkontakte/vkui/dist/lib/platform';

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
						permissions: [...group.permissions, ...action.permissions]
					}
				}
			}
		case "ADD_USER":
			return { ...state, users: [...state.users, action.user] }
		default: return state;
	}
}

const declOfNum = (number, titles) => {
	const cases = [2, 0, 1, 1, 1, 2];
	return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
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
			groupName: "",
			groupPermission: "",
			groups: [],
			activeView: "main",
			permissions: [],
			editGroup: null
		}

		this.fetchData();

		this.addUser = this.addUser.bind(this);
		this.addGroup = this.addGroup.bind(this);
		this.addPermission = this.addPermission.bind(this);

		this.onChange = this.onChange.bind(this);
		this.editGroup = this.editGroup.bind(this);
		this.removeGroup = this.removeGroup.bind(this);

		store.subscribe(() => {
			console.log(store.getState())
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
		this.setState({ valid: name.length > 0 ? "default" : "error", groupName: "" });
		if (name.length < 1) return
		store.dispatch({ type: "ADD_GROUP", name });
	}

	saveGroup(group) {
		let permissions = this.state.permissions;
		store.dispatch({ type: "SET_PERMISSIONS", groupID: group.id, permissions });
		this.setState({ groupPermission: "", permissions: [] })
	}

	removeGroup(group){
		this.setState({ popout: <Alert
			actionsLayout= {platform == OS.ANDROID ? "horizontal" : "vertical"}
			actions={[{
			  title: 'Удалить',
			  autoclose: true,
			  style: 'destructive',
			 // action: () => this.addActionLogItem('Пользователь больше не может модерировать контент.'),
			}, {
			  title: 'Отмена',
			  autoclose: true,
			  style: 'cancel'
			}]}
			onClose={this.closePopout}
		  >
			<h2>Подтвердите действие</h2>
			<p>Вы уверены, что хотите удалить группу <b>{group.name}</b>?</p>
		  </Alert> })
	}

	addPermission() {
		let permission = this.state.groupPermission;
		//this.setState({ valid: permission.length > 0 ? "default" : "error" });
		if (permission.length < 1) return
		//
		this.setState({ permissions: [...this.state.permissions, permission], groupPermission: "" })

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

	editGroup(group) {
		this.setState({ permissions: group.permissions })

		const PermissionsList = () => {
			return (
				<List>
					{this.state.permissions.length > 0 ? this.state.permissions.map((permission, i) => <Cell removable onRemove={() => {
						this.setState({
							permissions: [...this.state.permissions.slice(0, i), ...this.state.permissions.slice(i + 1)]
						})
					}} key={permission}>{permission}</Cell>) : <Placeholder icon={<Icon56LockOutline />}>В группе не установлены <br /> права</Placeholder>}
				</List>
			)
		}

		const GroupPermissionInput = () => {
			return (<Input value={this.state.groupPermission} onChange={this.onChange} name="groupPermission" type="text" placeholder="Право" />)
		}

		const PermissionsCounter = () => {
			let count = this.state.permissions.length;
			return (count > 0 && <Footer>{count} {declOfNum(count, ["право", "права", "прав"])}</Footer>)
		}

		this.setState({
			editGroup: <Panel id="editGroup_main">
				<PanelHeader
					left={<PanelHeaderClose onClick={() => this.setState({ activeView: 'main' })} />}
					right={<PanelHeaderSubmit primary onClick={() => {
						this.saveGroup(group)
						this.setState({ activeView: 'main' })
					}} />}
				>
					Редактирование группы
            </PanelHeader>
				<Group>
					<Div style={{
						display: "flex"
					}}>
						<div style={{ flex: "0 1 100%" }}>
							<Input disabled type="text" value={group.name} />
						</div>
						<Button onClick={() => this.removeGroup(group)} style={{ flex: "0 0 auto",  marginLeft: "10px" }} level="destructive">Удалить группу</Button>
					</Div>
					<Div style={{
						display: "flex"
					}}>
						<div style={{ flex: "0 1 100%" }} >
							<GroupPermissionInput />
						</div>
						<Button style={{ marginLeft: "10px" }} onClick={this.addPermission}>Добавить</Button>
					</Div>
					<PermissionsList />
				</Group>
				<PermissionsCounter />
			</Panel>, activeView: "editGroup"
		})
	}

	render() {
		const groupsCount = this.state.groups.length;
		return (
			<ConfigProvider>
				<Root popout={this.state.popout} activeView={this.state.activeView}>
					<View id="main" activePanel="main_main">
						<Panel id="main_main">
							<PanelHeader>JSPermission</PanelHeader>
							<Group>

							</Group>
							<Group>
								<Div style={{
									display: "flex",
								}}>
									<div style={{ flex: "0 1 100%" }} >
										<Input status={this.state.valid} value={this.state.groupName} onChange={this.onChange} name="groupName" type="text" placeholder="Название группы" />
									</div>
									<Button style={{ marginLeft: "10px" }} onClick={this.addGroup}>Добавить</Button>
								</Div>
								<List>
									{groupsCount > 0 ? this.state.groups.map((group, i) => <Cell asideContent={<div style={{ display: "flex" }}><Icon24Write onClick={() => this.editGroup(group)} size={16} /><Switch checked={false} style={{ marginLeft: "5px" }} /></div>} before={<Avatar><Icon28UsersOutline /></Avatar>} description={"Права: " + this.getPermissions(group)} key={i}>{group.name}</Cell>) : <Placeholder icon={<Icon56UsersOutline />}>Нет групп</Placeholder>}
								</List>

							</Group>
							{groupsCount > 0 && <Footer>{groupsCount} {declOfNum(groupsCount, [" группа", " группы", " групп"])}</Footer>}
						</Panel>
					</View>
					<View id="editGroup" activePanel="editGroup_main">
						{this.state.editGroup}
					</View>
				</Root>
			</ConfigProvider>
		);
	}
}

